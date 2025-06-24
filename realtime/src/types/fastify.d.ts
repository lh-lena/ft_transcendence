import 'fastify';
import type { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { EnvironmentConfig } from '../config/server.config';
import type { User } from './pong.types';
import type { NETWORK_GUALITY } from './network.types';

declare module 'fastify' {
  interface FastifyInstance {
    wsService: ReturnType<typeof import('../services/ws.service').createWSService>;
    connectionService: ReturnType<typeof import('../services/connection.service').connectionService>;
    reconnectionService: ReturnType<typeof import('../services/reconnection.service').reconnectionService>;
    networkService: ReturnType<typeof import('../services/network.service').networkMonitorService>;
    auth: ReturnType<typeof import('../services/auth.service').authService>;
    wss: WebSocketServer;
    config: EnvironmentConfig;
  }

  type WSConnection = WebSocket & {
    userId: number;
    username: string;
    userAlias: string;
    currentGameId?: string;
    lastPing: number;
    lastPong: number;
    authenticated: boolean;
    isReconnecting: boolean;
    networkQuality: NETWORK_GUALITY;
    latency: number;
    missedPings: number;
    heartbeatTimeout?: NodeJS.Timeout;
    reconnectTimer?: NodeJS.Timeout;
  }

  interface VarifyClientInfo {
    origin: string;
    secure: boolean;
    req: IncomingMessage;
  }
}
