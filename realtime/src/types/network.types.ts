import { ConnectionState, User } from './pong.types';

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
    reason: string;
    pausedAt: number;
    players: Array<User>;
}
