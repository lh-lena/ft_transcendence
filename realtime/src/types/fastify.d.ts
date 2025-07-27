import 'fastify';
import type { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';

declare module 'fastify' {
  interface FastifyInstance {
    eventBus: import('event').EventEmitter;
    wsService: ReturnType<
      typeof import('../services/ws.service').createWSService
    >;
    respond: ReturnType<
      typeof import('../services/ws.service').createRespondService
    >;
    connectionService: ReturnType<
      typeof import('../services/connection.service').connectionService
    >;
    reconnectionService: ReturnType<
      typeof import('../services/reconnection.service').reconnectionService
    >;
    gameService: ReturnType<
      typeof import('../services/game.service').createGameService
    >;
    gameSessionService: ReturnType<
      typeof import('../services/game-session.service').createGameSessionService
    >;
    gameDataService: ReturnType<
      typeof import('../services/game-session.service').createGameDataService
    >;
    gameStateService: ReturnType<
      typeof import('../services/game-state.service').createGameStateService
    >;

    auth: ReturnType<typeof import('../services/auth.service').authService>;
    wss: WebSocketServer;
    config: import('../config/server.config').EnvironmentConfig;
  }

  type WSConnection = WebSocket & {
    user: {
      userId: number;
      username: string;
      userAlias: string;
    };
    gameId?: string | null;
    lastPing: number;
    lastPong: number;
    authenticated: boolean;
    isReconnecting: boolean;
    networkQuality: import('./network.types.js').NETWORK_QUALITY;
    latency: number;
    missedPings: number;
    heartbeatTimer?: NodeJS.Timeout;
    reconnectTimer?: NodeJS.Timeout;
  };

  interface VerifyClientInfo {
    origin: string;
    secure: boolean;
    req: IncomingMessage;
  }
}
