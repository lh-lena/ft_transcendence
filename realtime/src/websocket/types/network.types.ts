import type { User } from '../../schemas/index.js';

export interface DisconnectInfo {
  userId: number;
  username: string;
  gameId: string | null;
  disconnectTime: number;
}

export interface GameDisconnectState {
  disconnectedPlayerIds: Set<number>;
  gameEndTimer?: NodeJS.Timeout;
  pausedByDisconnection: boolean;
}

export interface PausedGameState {
  gameId: string;
  pausedByPlayerId: number;
  pausedAt: number;
  players: Array<User>;
  playersWhoPaused: Set<number>;
}
