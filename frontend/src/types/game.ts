export enum GameStatus {
    MENU = 'menu',
    PLAYING = 'playing',
    PAUSED = 'paused',
    GAME_OVER = 'game_over'
}

export interface Ball {
    x: number;
    y: number;
}

export interface Paddle {
    x: number;
    y: number;
    width: number;
    height: number;
    score: number;
}

export interface GameState {
    ball: Ball;
    paddles: {
        left: Paddle;
        right: Paddle;
    };
}