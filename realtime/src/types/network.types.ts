import { ConnectionState } from './pong.types';

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
    reason: string;
    pausedAt: number;
    playerStates: Map<number, ConnectionState>
}

// export interface WSConnection extends WebSocket {
//     userId: number;
//     username: string;
//     userAlias: string; // If applicable
//     currentGameId?: string | null; // Make it explicitly nullable/optional
//     lastPing: number;
//     lastPong: number;
//     authenticated: boolean;
//     isReconnecting: boolean;
//     networkQuality: NETWORK_QUALITY; // Custom property
//     latency: number;                  // Custom property
//     missedPings: number;              // Custom property
//     // Add any other custom properties you assign to 'ws'
// }