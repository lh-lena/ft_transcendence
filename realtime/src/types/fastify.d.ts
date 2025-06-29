import 'fastify';
import type { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';

declare module 'fastify' {
  interface FastifyInstance {
    wsService: ReturnType<typeof import('../services/ws.service').createWSService>;
    connectionService: ReturnType<typeof import('../services/connection.service').connectionService>;
    reconnectionService: ReturnType<typeof import('../services/reconnection.service').reconnectionService>;
    networkService: ReturnType<typeof import('../services/network.service').networkMonitorService>;
    gameService: ReturnType<typeof import('../services/game.service').createGameService>;
    auth: ReturnType<typeof import('../services/auth.service').authService>;
    wss: WebSocketServer;
    config: import('../config/server.config').EnvironmentConfig;
  }

  type WSConnection = WebSocket & {
    userId: number;
    username: string;
    userAlias: string;
    state: import('./pong.types.js').ConnectionState;
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
  }

  interface VerifyClientInfo {
    origin: string;
    secure: boolean;
    req: IncomingMessage;
  }
}
