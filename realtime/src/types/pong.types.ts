import { ErrorCode } from './error.types';

export interface WsClientMessage {
    'game_start': { gameId: string };
    'game_leave': { gameId: string };
    'game_update': PlayerInput;
    'game_pause': { gameId: string };
    'game_resume': { gameId: string };
    'chat_message': ChatMessage;
    'notification': NotificationPayload;
}

export interface WsServerBroadcast {
    'connected': { userId: number };
    'game_update': GameState;
    'game_ended': GameResult;
    'game_pause': { gameId: string, reason: string };
    'countdown_update': { gameId: string, countdown: number, message: string };
    'chat_message': ChatMessage;
    'notification': NotificationPayload;
    'error': { message: string, code: ErrorCode };
}

export interface incomingMessage<T extends keyof WsClientMessage> {
    event: T;
    payload: WsClientMessage[T];
}

export const PONG_CONFIG = {
    BOARD_WIDTH: 900,
    BOARD_HEIGHT: 550,
    PADDLE_WIDTH: 10,
    PADDLE_HALF_WIDTH: 5,
    PADDLE_HEIGHT: 80,
    PADDLE_HALF_HEIGHT: 40,
    PADDLE_OFFSET: 5,
    PADDLE_SPEED: 10,
    BALL_SIZE: 10,
    INITIAL_BALL_VELOCITY: 1.2,
    INITIAL_BALL_SPEED_X: 4,
    INITIAL_BALL_SPEED_Y: 4,
    FPS: 60,
    MAX_SCORE: 11,
    COUNTDOWN: 3
};

export enum GameMode {
    PVP_REMOTE = 'pvp_remote',
    PVP_LOCAL = 'pvp_local',
    PVB_AI = 'pvb_ai',
}

export enum GameSessionStatus {
    PENDING = 'pending',    // Created but not yet started on ws-server
    ACTIVE = 'active',      // running on ws-server
    PAUSED = 'paused',      // temporarily paused
    FINISHED = 'finished',  // game finished
    CANCELLED = 'cancelled',// game aborted
    CANCELLED_SERVER_ERROR = 'cancelled_server_error',// game aborted by server due to error or shutdown
}

export enum AIDifficulty {
    EASY = 'easy', // 60% accuracy, slow reaction 200ms delay
    MEDIUM = 'medium', // 75% accuracy, moderate reaction 100ms delay
    HARD = 'hard', // 90% accuracy, fast reaction 50ms delay
}

export enum ConnectionState {
    CONNECTED = 'connected',
    DISCONNECTED = 'diconnected'
}

export interface GameState {
    gameId: string;
    ball: { x: number; y: number; dx: number; dy: number; v: number; };
    paddleA: {
        width: number;
        height: number;
        x: number;
        y: number;
        score: number;
        speed: number;
        direction: Direction;
    };
    paddleB: {
        width: number;
        height: number;
        x: number;
        y: number;
        score: number;
        speed: number;
        direction: Direction;
    };
    activePaddle: string;
    status: GameSessionStatus;
    countdown: number;
    sequence: number;
}

export enum Direction {
    UP = -1,
    DOWN = 1,
    STOP = 0
}

export interface PlayerInput {
    direction: Direction;
    sequence: number;
}

export interface ChatMessage {
    userId: number;
    username: string;
    recipientId: number;
    message: string;
    timestamp: string;
}

export interface NotificationPayload {
    type: 'info' | 'warn';
    tournamentId?: number;
    gameId: string;
    message: string;
    timestamp: number;
}

export interface User {
    userId: number;
    username: string;
    userAlias: string;
}

export interface StartGame {
    gameId: string;
    gameMode: GameMode;
    players: Array<User>,
    aiDifficulty?: AIDifficulty;
}

export interface GameResult {
    gameId: string;
    scorePlayer1: number;
    scorePlayer2: number;
    winnerId: number | null;
    loserId: number | null;
    player1Username: string | null;
    player2Username: string | null;
    status: GameSessionStatus.FINISHED | GameSessionStatus.CANCELLED | GameSessionStatus.CANCELLED_SERVER_ERROR;
    startedAt: string;
    finishedAt: string;
}

export interface GameInstance {
    gameId: string;
    gameMode: GameMode;
    players: Array<User>;
    connectedPlayer1: boolean;
    connectedPlayer2: boolean;
    gameState: GameState;
    status: GameSessionStatus;
    gameLoopInterval?: NodeJS.Timeout;
    lastUpdate: number;
    startedAt: string | null;
    finishedAt: string | null;
    frameCount?: number
    lastCountdownTime?: number;
}
