import { User } from '../schemas/user.schema.js';

export enum NETWORK_QUALITY {
    GOOD = 'good',
    POOR = 'poor',
    FAIR = 'fair',
    DISCONNECTED = 'disconnected'
}

export interface DisconnectInfo {
    userId: number;
    username: string;
    gameId: string | undefined;
    disconnectTime: number;
}

export interface PausedGameState {
    gameId: string;
    pausedByPlayerId: number;
    pausedAt: number;
    players: Array<User>;
}
