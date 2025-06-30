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
    'game_started': { gameId: string; status: GameSessionStatus; };
    'game_state_sync': GameState;
    'game_ended': GameResult;
    'game_pause': { gameId: string };
    'game_resume': { gameId: string };
    'chat_message': ChatMessage;
    'notification': NotificationPayload;
    'error': {error: string};
}

export interface incomingMessage<T extends keyof WsClientMessage> {
    event: T;
    payload: WsClientMessage[T];
}

export const GAME_CONFIG = {
    BOARD_WIDTH: 800,
    BOARD_HEIGHT: 400,
    PADDLE_WIDTH: 10,
    PADDLE_HEIGHT: 80,
    BALL_RADIUS: 8,
    PADDLE_SPEED: 5,
    INITIAL_BALL_SPEED_X: 5,
    INITIAL_BALL_SPEED_Y: 3,
    FPS: 60,
    MAX_SCORE: 11
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
    ball: { x: number; y: number; dx: number; dy: number; radius: number; };
    paddle1: { y: number; height: number; width: number; score: number; };
    paddle2: { y: number; height: number; width: number; score: number; };
    status: GameSessionStatus;
    maxScore: number; // do i need this here?
    aiDifficulty?: AIDifficulty; // do i need this here?
}

export enum PlayerInputType {
    MOVE_UP = 'up',
    MOVE_DOWN = 'down',
}

export interface PlayerInput {
    inputType: PlayerInputType;
}

export interface ChatMessage {
    userId: number;
    username: string;
    recipientId: number;
    message: string;
    timestamp: string;
}

export interface NotificationPayload {
    tournamentId?: number;
    gameId?: string;
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
    status: GameSessionStatus.FINISHED | GameSessionStatus.CANCELLED;
    startedAt: string;
    finishedAt: string;
}

export interface GameInstance {
    gameId: string;
    gameMode: GameMode;
    players: Array<User>,
    gameState: GameState;
    status: GameSessionStatus;
    gameLoopInterval?: NodeJS.Timeout;
    lastUpdate: number;
    startedAt: string;
    finishedAt: string | null;
}


