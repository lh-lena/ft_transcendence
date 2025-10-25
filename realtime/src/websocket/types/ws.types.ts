import type { WSConnection } from 'fastify';
import type { DisconnectInfo } from './network.types.js';
import type { GameState, GameResult, GameIdType } from '../../schemas/game.schema.js';
import type { NotificationType } from '../../constants/game.constants.js';
import type { User, UserIdObject, UserIdType } from '../../schemas/user.schema.js';
import type { ChatMessageBroadcast } from '../../schemas/chat.schema.js';

export interface RespondService {
  connected: (userId: UserIdType) => boolean;
  gameStarted: (gameId: GameIdType, players: UserIdObject[]) => boolean;
  gameUpdate: (userId: UserIdType, gameState: GameState) => boolean;
  gameEnded: (gameId: GameIdType, result: GameResult) => boolean;
  gamePaused: (gameId: GameIdType, reason: string) => boolean;
  chatMessage: (userId: UserIdType, payload: ChatMessageBroadcast) => boolean;
  countdownUpdate: (gameId: GameIdType, countdown: number, message: string) => boolean;
  error: (userId: UserIdType, message: string) => boolean;
  notification: (userId: UserIdType, type: NotificationType, message: string) => boolean;
  notificationToGame: (
    gameId: GameIdType,
    type: NotificationType,
    message: string,
    excludeUsers?: UserIdType[],
  ) => boolean;
}

export interface ConnectionService {
  handleNewConnection: (ws: WSConnection) => void;
  getConnection: (userId: UserIdType) => WSConnection | undefined;
  addConnection: (conn: WSConnection) => void;
  removeConnection: (ws: WSConnection) => void;
  handleConnectionLoss: (userId: UserIdType) => void;
  handlePong: (userId: UserIdType) => void;
  reconnectPlayer: (userId: UserIdType) => void;
  updateUserGame: (userId: UserIdType, gameId: GameIdType | null) => void;
  notifyShutdown: () => Promise<void>;
  shutdown: () => Promise<void>;
}

export interface ReconnectionService {
  handlePlayerReconnection: (userId: UserIdType) => DisconnectInfo | undefined;
  handlePlayerDisconnect: (user: User, gameId: GameIdType) => void;
  hasDisconnectData: (userId: UserIdType) => boolean;
  cleanup: (userId?: UserIdType) => void;
}

export interface ConnectionRegistry {
  set(userId: UserIdType, conn: WSConnection): void;
  remove(userId: UserIdType): void;
  get(userId: UserIdType): WSConnection | undefined;
  has(userId: UserIdType): boolean;
  clear(): void;
  size(): number;
  getAll(): Map<UserIdType, WSConnection>;
}

export interface HeartbeatService {
  startHeartbeat: (userId: UserIdType, heartbeatInterval: number) => void;
  handlePong: (userId: UserIdType) => void;
  stopHeartbeat: (ws: WSConnection) => void;
}
