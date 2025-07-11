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