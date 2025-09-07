import type { Player, UserIdType, GameIdType } from '../../schemas/index.js';

export interface DisconnectInfo {
  userId: UserIdType;
  username: string;
  gameId: GameIdType | null;
  disconnectTime: number;
}

export interface GameDisconnectState {
  disconnectedPlayerIds: Set<UserIdType>;
  gameEndTimer?: NodeJS.Timeout;
  pausedByDisconnection: boolean;
}

export interface PausedGameState {
  gameId: GameIdType;
  pausedByPlayerId: UserIdType;
  pausedAt: number;
  players: Array<Player>;
  playersWhoPaused: Set<UserIdType>;
}
