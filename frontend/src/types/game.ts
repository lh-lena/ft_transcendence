export interface GameState {
    ball: {
        x: number;
        y: number;
        dx: number;
        dy: number;
        radius: number;
    };
    paddles: {
        left: { x: number; y: number; height: number; width: number; score: number };
        right: { x: number; y: number; height: number; width: number; score: number };
    };
}

export enum GameStatus {
    MENU = 'menu',
    PLAYING = 'playing',
    PAUSED = 'paused',
    GAME_OVER = 'gameOver'
}