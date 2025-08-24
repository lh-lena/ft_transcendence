import type { WSConnection } from 'fastify';
import type { DisconnectInfo } from './network.types.js';
import type { GameState, GameResult } from '../../schemas/game.schema.js';
import type { NotificationType } from '../../constants/game.constants.js';
import type { User } from '../../schemas/user.schema.js';

export interface RespondService {
  connected: (userId: number) => boolean;
  gameUpdate: (userId: number, gameState: GameState) => boolean;
  gameEnded: (gameId: string, result: GameResult) => boolean;
  gamePaused: (gameId: string, reason: string) => boolean;
  chatMessage: (userId: number) => boolean;
  countdownUpdate: (gameId: string, countdown: number, message: string) => boolean;
  error: (userId: number, message: string) => boolean;
  notification: (userId: number, type: NotificationType, message: string) => boolean;
  notificationToGame: (
    gameId: string,
    type: NotificationType,
    message: string,
    excludeUsers?: number[],
  ) => boolean;
}

export interface ConnectionService {
  handleNewConnection: (ws: WSConnection) => void;
  getConnection: (userId: number) => WSConnection | undefined;
  addConnection: (conn: WSConnection) => void;
  removeConnection: (ws: WSConnection) => void;
  handleConnectionLoss: (userId: number) => void;
  handlePong: (userId: number) => void;
  reconnectPlayer: (userId: number) => void;
  updateUserGame: (userId: number, gameId: string | null) => void;
  notifyShutdown: () => Promise<void>;
  shutdown: () => Promise<void>;
}

export interface ReconnectionService {
  handlePlayerReconnection: (userId: number) => DisconnectInfo | undefined;
  handlePlayerDisconnect: (user: User, gameId: string) => void;
  hasDisconnectData: (userId: number) => boolean;
  attemptReconnection: (userId: number) => string | null;
  cleanup: (userId?: number) => void;
}

export interface ConnectionRegistry {
  set(userId: number, conn: WSConnection): void;
  remove(userId: number): void;
  get(userId: number): WSConnection | undefined;
  has(userId: number): boolean;
  clear(): void;
  size(): number;
  getAll(): Map<number, WSConnection>;
}

export interface HeartbeatService {
  startHeartbeat: (userId: number, heartbeatInterval: number) => void;
  handlePong: (userId: number) => void;
  stopHeartbeat: (ws: WSConnection) => void;
}
