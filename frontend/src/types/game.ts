export enum GameStatus {
    MENU = 'menu',
    PLAYING = 'playing',
    PAUSED = 'paused',
    GAME_OVER = 'game_over'
}

export interface Ball {
    x: number;
    y: number;
    dx: number;
    dy: number;
    v: number;
    color: string;
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
    playerA: Player;
    playerB: Player;
}

export const CANVAS_DEFAULTS = {
    width: 900, // Default width
    height: 550, // Default height
}

export const BALL_DEFAULTS = {
    x: CANVAS_DEFAULTS.width / 2,
    y: CANVAS_DEFAULTS.height / 2,
    dx: Math.random() < 0.5 ? 6 : -6,
    dy: Math.random() < 0.5 ? 1 : -1,
    v: 1.2,
    color: 'white'
};

const paddleHeight = 80;
const paddleWidth = 10;

export const PADDLE_A_DEFAULTS = {
    width: paddleWidth,
    height: paddleHeight,
    x: 5,
    y: BALL_DEFAULTS.y - (paddleHeight / 2),
    score: 0,
    speed: 10,
    color: 'white'
};

export const PADDLE_B_DEFAULTS = {
    width: 10,
    height: paddleHeight,
    x: CANVAS_DEFAULTS.width - ( PADDLE_A_DEFAULTS.x + paddleWidth ),
    y: BALL_DEFAULTS.y - ( paddleHeight / 2 ),
    score: 0,
    speed: 10,
    color: 'white'
};