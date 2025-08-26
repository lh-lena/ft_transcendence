import { WebSocket } from 'ws';
import type { FastifyInstance, WSConnection } from 'fastify';
import type { WsServerBroadcast } from '../../schemas/ws.schema.js';
import type { GameResult, GameState, GameSession } from '../../schemas/game.schema.js';
import type { NotificationType } from '../../constants/game.constants.js';
import { processErrorLog } from '../../utils/error.handler.js';
import type { RespondService, ConnectionService } from '../types/ws.types.js';
import type { GameSessionService } from '../../game/types/game.js';

export default function createRespondService(app: FastifyInstance): RespondService {
  const { log } = app;

  function send<T extends keyof WsServerBroadcast>(
    userId: number,
    event: T,
    payload: WsServerBroadcast[T],
  ): boolean {
    const connectionService = app.connectionService as ConnectionService;
    const conn = connectionService.getConnection(userId) as WSConnection | null;
    if (!conn || conn.readyState !== WebSocket.OPEN) {
      log.error(
        `[ws-service] Cannot send to user ID ${userId} event ${event} payload ${JSON.stringify(payload)} - connection not found`,
      );
      return false;
    }
    const message = { event, payload };
    try {
      const messageStr = JSON.stringify(message);
      conn.send(messageStr);
      return true;
    } catch (error: unknown) {
      processErrorLog(app, 'ws-service', `Failed to send to user ${userId}`, error);
      connectionService.removeConnection(conn);
      return false;
    }
  }

  function broadcast<T extends keyof WsServerBroadcast>(
    gameId: string,
    event: T,
    payload: WsServerBroadcast[T],
    excludeUsers: number[] = [],
  ): boolean {
    const gameSessionService = app.gameSessionService as GameSessionService;
    const game = gameSessionService.getGameSession(gameId) as GameSession;
    if (game === undefined || game === null) {
      log.warn(`[ws-service] Cannot broadcast to game ${gameId} - game not found`);
      return false;
    }

    const { players } = game;
    const userIds = players
      .map((p) => p.userId)
      .filter((id) => id !== -1 && game.isConnected.get(id) === true && !excludeUsers.includes(id));

    const results: boolean[] = [];
    userIds.forEach((id) => {
      log.debug(`[ws-service] Sending to user ID ${id} event ${event}`);
      const res = send(id, event, payload);
      results.push(res);
    });
    return results.every((r) => r === true);
  }

  function connected(userId: number): boolean {
    return send(userId, 'connected', { userId });
  }

  function gameUpdate(userId: number, gameState: GameState): boolean {
    return send(userId, 'game_update', { ...gameState });
  }

  function gameEnded(gameId: string, result: GameResult): boolean {
    return broadcast(gameId, 'game_ended', result);
  }

  function gamePaused(gameId: string, reason: string): boolean {
    return broadcast(gameId, 'game_pause', { gameId, reason });
  }

  function chatMessage(userId: number): boolean {
    return send(userId, 'chat_message', {
      userId,
      timestamp: Date.now(),
    });
  }

  function countdownUpdate(gameId: string, countdown: number, message: string): boolean {
    return broadcast(gameId, 'countdown_update', { gameId, countdown, message });
  }

  function error(userId: number, message: string): boolean {
    return send(userId, 'error', { message });
  }

  function notification(userId: number, type: NotificationType, message: string): boolean {
    return send(userId, 'notification', { type, message, timestamp: Date.now() });
  }

  function notificationToGame(
    gameId: string,
    type: NotificationType,
    message: string,
    excludeUsers: number[] = [],
  ): boolean {
    return broadcast(
      gameId,
      'notification',
      { type, message, timestamp: Date.now() },
      excludeUsers,
    );
  }

  return {
    connected,
    gameUpdate,
    gameEnded,
    gamePaused,
    chatMessage,
    countdownUpdate,
    notification,
    notificationToGame,
    error,
  };
}
