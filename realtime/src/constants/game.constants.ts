export const PONG_CONFIG = {
  BALL_RESET_DELAY: 1,
  INCREMENT_BALL_VELOCITY: 2,
  MAX_BALL_DY: 2.5,
  FPS: 60,
  FRAME_TIME_CAP_SECONDS: 2 / 60,
  MAX_SCORE: 11,
  COUNTDOWN: 3,
};

export const BOARD_DEFAULTS = {
  width: 900,
  height: 550,
};

export const BALL_DEFAULTS = {
  x: BOARD_DEFAULTS.width / 2,
  y: BOARD_DEFAULTS.height / 2,
  dx: Math.random() < 0.5 ? 6 : -6,
  dy: Math.random() < 0.5 ? 1 : -1,
  v: 70,
  size: 15,
};

export const PADDLE_DEFAULTS = {
  height: 80,
  width: 15,
  speed: 500,
  score: 0,
  offset: 5,
};

export enum GameMode {
  PVP_REMOTE = 'pvp_remote',
  PVP_LOCAL = 'pvp_local',
  PVB_AI = 'pvb_ai',
}

export enum PaddleName {
  PADDLE_A = 'paddleA',
  PADDLE_B = 'paddleB',
}

export enum GameSessionStatus {
  PENDING = 'pending', // Created but not yet started on ws-server
  ACTIVE = 'active', // running on ws-server
  PAUSED = 'paused', // temporarily paused
  FINISHED = 'finished', // game finished
  CANCELLED = 'cancelled', // game aborted
  CANCELLED_SERVER_ERROR = 'cancelled_server_error', // game aborted by server due to error or shutdown
}

export enum ConnectionState {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
}

export enum NotificationType {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export enum Direction {
  UP = -1,
  DOWN = 1,
  STOP = 0,
}
