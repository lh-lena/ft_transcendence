import { GameResult, GameState } from '../schemas/game.schema';
import { User } from '../schemas/user.schema';

export const PONG_CONFIG = {
    BOARD_WIDTH: 900,
    BOARD_HEIGHT: 550,
    PADDLE_WIDTH: 10,
    PADDLE_HALF_WIDTH: 5,
    PADDLE_HEIGHT: 80,
    PADDLE_HALF_HEIGHT: 40,
    PADDLE_OFFSET: 5,
    PADDLE_SPEED: 400,
    BALL_SIZE: 10,
    BALL_RESET_DELAY: 1,
    INITIAL_BALL_VELOCITY: 1.2,
    INCREMENT_BALL_VELOCITY: 0.1,
    MAX_BALL_VELOCITY: 2.5,
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
    DISCONNECTED = 'disconnected'
}

export enum NotificationType {
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error'
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

