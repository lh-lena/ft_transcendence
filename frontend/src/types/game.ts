export enum GameStatus {
  MENU = "menu",
  PLAYING = "playing",
  PAUSED = "paused",
  GAME_OVER = "game_over",
}

export interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  v: number;
  color: string;
  size: number;
  acceleration: number;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
  speed: number;
  color: string;
}

export interface Player {
  username: string;
  score: number;
  color: string;
  colorMap: string[];
}

export interface GameState {
  status: GameStatus;
  previousStatus: GameStatus;
  playerA: Player;
  playerB: Player;
  blockedPlayButton: boolean;
}

export const CANVAS_DEFAULTS = {
  width: 900, // Default width
  height: 550, // Default height
};

export const BALL_DEFAULTS = {
  x: CANVAS_DEFAULTS.width / 2,
  y: CANVAS_DEFAULTS.height / 2,
  dx: Math.random() < 0.5 ? 6 : -6,
  dy: Math.random() < 0.5 ? 1 : -1,
  v: 70,
  color: "white",
  size: 15,
  acceleration: 2,
};

export const PADDLE_DEFAULTS = {
  height: 80,
  width: 15,
  speed: 500,
  color: "white",
  score: 0,
};

export const PADDLE_A_DEFAULTS = {
  width: PADDLE_DEFAULTS.width,
  height: PADDLE_DEFAULTS.height,
  x: 5,
  y: BALL_DEFAULTS.y - PADDLE_DEFAULTS.height / 2,
  score: PADDLE_DEFAULTS.score,
  speed: PADDLE_DEFAULTS.speed,
  color: PADDLE_DEFAULTS.color,
};

export const PADDLE_B_DEFAULTS = {
  width: PADDLE_DEFAULTS.width,
  height: PADDLE_DEFAULTS.height,
  x: CANVAS_DEFAULTS.width - (PADDLE_A_DEFAULTS.x + PADDLE_DEFAULTS.width),
  y: BALL_DEFAULTS.y - PADDLE_DEFAULTS.height / 2,
  score: PADDLE_DEFAULTS.score,
  speed: PADDLE_DEFAULTS.speed,
  color: PADDLE_DEFAULTS.color,
};
