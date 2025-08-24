import 'fastify';
import type { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { EventEmitter } from 'events';
import type {
  createWSService,
  createRespondService,
} from '../../modules/websocket/services/ws.service.js';
import type { createConnectionService } from '../../modules/websocket/services/connection.service.js';
import type { createGameService } from '../../modules/game/services/game.service.js';
import type {
  createGameSessionService,
  createGameDataService,
} from '../../modules/game/services/game-session.service.js';
import type { createGameStateService } from '../../modules/game/services/game-state.service.js';
import type { createChatService } from '../../modules/chat/services/chat.service.js';
import type { authService } from '../../modules/auth/services/auth.service.js';
import type { createAIService } from '../../modules/ai/ai.js';
import type { EnvironmentConfig } from '../../config/config.js';
import type { NETWORK_QUALITY } from '../websocket/types/network.types.js';

declare module 'fastify' {
  interface FastifyInstance {
    eventBus: EventEmitter;
    wsService: ReturnType<typeof createWSService>;
    connectionService: ReturnType<typeof createConnectionService>;
    respond: ReturnType<typeof createRespondService>;
    gameService: ReturnType<typeof createGameService>;
    gameSessionService: ReturnType<typeof createGameSessionService>;
    gameDataService: ReturnType<typeof createGameDataService>;
    gameStateService: ReturnType<typeof createGameStateService>;
    chatService: ReturnType<typeof createChatService>;
    auth: ReturnType<typeof authService>;
    aiService: ReturnType<typeof createAIService>;
    wss: WebSocketServer;
    config: EnvironmentConfig;
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
    networkQuality: NETWORK_QUALITY;
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
