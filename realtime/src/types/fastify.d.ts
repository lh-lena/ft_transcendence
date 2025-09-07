import 'fastify';
import type { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { EventEmitter } from 'events';
import type { createWSService, createRespondService } from '../websocket/services/ws.service.js';
import type { createConnectionService } from '../websocket/services/connection.service.js';
import type { createGameService } from '../game/services/game.service.js';
import type {
  createGameSessionService,
  createGameDataService,
} from '../game/services/game-session.service.js';
import type { createGameStateService } from '../game/services/game-state.service.js';
import type { createChatService } from '../chat/services/chat.service.js';
import type { authService } from '../auth/services/auth.service.js';
import type { createAIService } from '../ai/ai.js';
import type { EnvironmentConfig } from '../config/config.js';
import type { NETWORK_QUALITY } from '../websocket/types/network.types.js';
import type { UserIdType } from '../schemas/user.schema.js';
import type { GameIdType } from '../schemas/game.schema.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: EnvironmentConfig;
    eventBus: EventEmitter;
    connectionService: ReturnType<typeof createConnectionService>;
    respond: ReturnType<typeof createRespondService>;
    wsService: ReturnType<typeof createWSService>;
    gameService: ReturnType<typeof createGameService>;
    gameSessionService: ReturnType<typeof createGameSessionService>;
    gameDataService: ReturnType<typeof createGameDataService>;
    gameStateService: ReturnType<typeof createGameStateService>;
    chatService: ReturnType<typeof createChatService>;
    auth: ReturnType<typeof authService>;
    aiService: ReturnType<typeof createAIService>;
    wss: WebSocketServer;
  }

  type WSConnection = WebSocket & {
    user: {
      userId: UserIdType;
      username: string;
      userAlias: string;
    };
    gameId?: GameIdType | null;
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
