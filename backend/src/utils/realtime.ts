/**
 * Real-time Communication Utility
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type { FastifyInstance } from 'fastify';
import type { gameType } from '../schemas/game';

/**
 * Notification event types
 */
export enum NotificationEvent {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  GAME_START = 'game_start',
  TOURNAMENT_UPDATE = 'tournament_update',
}

/**
 * Notification payload structure
 */
export interface NotificationPayload {
  event: NotificationEvent;
  reciever: string;
  sender?: string;
  payload: Record<string, unknown>;
}

/**
 * Real-time Service Class
 */
export class RealtimeService {
  private client: AxiosInstance;
  private server: FastifyInstance;
  private config: {
    baseURL: string;
    timeout: number;
    retryAttempts: number;
  };

  /**
   * Create real-time service
   */
  constructor(server: FastifyInstance) {
    this.server = server;

    const realtimeIP = server.config.REALTIME_IP;
    const realtimePort = server.config.REALTIME_PORT;

    const timeout = Number(server.config.REALTIME_TIMEOUT);

    const retryAttempts = Number(server.config.REALTIME_RETRY_TRYS);

    this.config = {
      baseURL: `http://${realtimeIP}:${realtimePort}`,
      timeout,
      retryAttempts,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        this.server.log.debug(
          {
            method: config.method,
            url: config.url,
            data: config.data,
          },
          'Real-time API request',
        );
        return config;
      },
      (error) => {
        this.server.log.error({ error }, 'Real-time API request error');
        return Promise.reject(error);
      },
    );

    this.client.interceptors.response.use(
      (response) => {
        this.server?.log.debug(
          {
            status: response.status,
            data: response.data,
          },
          'Real-time API response',
        );
        return response;
      },
      (error) => {
        this.handleAxiosError(error);
        return Promise.reject(error);
      },
    );
  }

  /**
   * Send game start notification
   */
  async sendGameStart(game: gameType): Promise<void> {
    try {
      await this.client.post('/api/game/start', game);

      this.server.log.info(
        {
          gameId: game.gameId,
          playerCount: game.players.length,
        },
        'Game start notification sent',
      );
    } catch (error) {
      this.server.log.error(
        {
          err: error,
          gameId: game.gameId,
        },
        'Failed to send game start notification',
      );
    }
  }

  /**
   * Send notification to player
   */
  async notifyPlayer(
    reciever: string,
    message: string,
    sender: string = '00000000-0000-0000-0000-000000000000',
    event: NotificationEvent = NotificationEvent.INFO,
  ): Promise<void> {
    try {
      const payload: NotificationPayload = {
        event,
        reciever,
        sender,
        payload: { message },
      };

      this.server.log.debug(await this.checkHealth(), 'Healthcheck Realtime');

      this.server.log.debug({ payload }, 'Player notification payload');

      await this.client.post('/api/notify', payload);

      this.server.log.info(
        {
          reciever,
          sender,
          event,
        },
        'Player notification sent',
      );
    } catch (error) {
      this.server.log.error(
        {
          err: error,
          reciever,
        },
        'Failed to send player notification',
      );
    }
  }

  /**
   * Check real-time service health
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.client.get('/health', { timeout: 2000 });
      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) this.handleAxiosError(error);
      else this.server?.log.warn({ error }, 'Real-time service health check failed');
      return false;
    }
  }

  /**
   * Handle axios errors
   */
  private handleAxiosError(error: AxiosError): void {
    if (error.response) {
      this.server.log.error(
        {
          status: error.response.status,
          data: error.response.data,
          url: error.config?.url,
        },
        'Real-time error',
      );
    } else if (error.request) {
      this.server.log.error(
        { url: error.config?.url, message: error.message },
        'Real-time no response',
      );
    } else {
      this.server.log.error({ message: error.message }, 'Real-time request error');
    }
  }
}
