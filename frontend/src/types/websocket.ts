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
  COUNTDOWN: 3,
};

export enum Direction {
  UP = -1,
  DOWN = 1,
  STOP = 0,
}

export interface GameState {
  gameId: string;
  ball: { x: number; y: number; dx: number; dy: number; v: number };
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
  activePaddle?: string;
  status: GameSessionStatus;
  countdown: number;
  sequence: number; // default 0
}

export enum GameSessionStatus {
  PENDING = "pending", // Created but not yet started on ws-server
  ACTIVE = "active", // running on ws-server
  PAUSED = "paused", // temporarily paused
  FINISHED = "finished", // game finished
  CANCELLED = "cancelled", // game aborted
  CANCELLED_SERVER_ERROR = "cancelled_server_error", // game aborted by server due to error or shutdown
}

export interface PlayerInput {
  gameId: string;
  direction: Direction;
  sequence: number; // default 0
}

export interface ChatMessage {
  recieverId: string; // for DMs
  message: string;
  timestamp: string;
}

export interface ReceivedChatMessage {
  senderId: string;
  message: string;
  timestamp: string;
}

export interface NotificationPayload {
  type: "info" | "warn" | "error";
  message: string;
  timestamp: number;
}

interface GameResult {
  gameId: string;
  scorePlayer1: number;
  scorePlayer2: number;
  winnerId: string | null; // -1 for AI
  loserId: string | null;
  player1Username: string | null; // for ai -> AI
  player2Username: string | null;
  status:
    | GameSessionStatus.FINISHED
    | GameSessionStatus.CANCELLED
    | GameSessionStatus.CANCELLED_SERVER_ERROR;
  startedAt: string;
  finishedAt: string;
}

// interacting with websocket

export interface WsClientMessage {
  game_start: { gameId: string };
  game_leave: { gameId: string };
  game_update: PlayerInput;
  game_pause: { gameId: string };
  game_resume: { gameId: string };
  chat_message: ChatMessage;
  notification: NotificationPayload;
}

export interface WsServerBroadcast {
  connected: { userId: number };
  game_update: GameState;
  game_ended: GameResult;
  game_pause: { gameId: string; reason: string };
  game_resume: { gameId: string };
  countdown_update: { gameId: string; countdown: number; message: string };
  chat_message: ReceivedChatMessage;
  notification: NotificationPayload;
  error: { message: string };
}

// Add this generic interface after WsEventPayload
export interface ClientMessageInterface<T extends keyof WsClientMessage> {
  event: T;
  payload: WsClientMessage[T];
}

// Add this generic interface after WsEventPayload
export interface ServerMessageInterface<T extends keyof WsServerBroadcast> {
  event: T;
  payload: WsServerBroadcast[T];
}
