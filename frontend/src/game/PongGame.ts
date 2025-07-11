import { Ball } from '../types';
import { Paddle } from '../types';
import { GameState } from '../types'

export class PongGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private onScoreUpdate: ((scoreA: number, scoreB: number) => void) | null = null;
    private gameState: GameState;

    // added ! so they dont need to be initialized directly in the constructor
    private ball!: Ball;
    private paddleA!: Paddle;
    private paddleB!: Paddle;

    private keys: { [key: string]: boolean } = {};

    private animationFrameId: number | null = null;
    private windowElement: HTMLDivElement;

    constructor(onScoreUpdate?: (scoreA: number, scoreB: number) => void, gameState: GameState) {
        this.gameState = gameState;
        if (onScoreUpdate) {
            this.onScoreUpdate = onScoreUpdate;
        }
        // Create window structure
        this.windowElement = document.createElement('div');
        this.windowElement.className = 'window border-2';
        
        // Create title bar
        const titleBar = document.createElement('div');
        titleBar.className = 'title-bar';
        this.windowElement.appendChild(titleBar);

        const title = document.createElement('h1');
        title.innerText = 'pong';
        title.className = 'title';
        titleBar.appendChild(title);
        
        // Create content area
        const contentArea = document.createElement('div');
        contentArea.className = 'window-content';
        this.windowElement.appendChild(contentArea);

        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.style.backgroundColor = '#a9b3d6ff'; 

        // Add canvas to the window content area
        contentArea.appendChild(this.canvas);
    
        // Get context for drawing
        const context = this.canvas.getContext('2d');
        if (!context) throw new Error('Could not get canvas context');
        this.ctx = context;
        
        // Set initial canvas size
        this.canvas.width = 900;  // Default width
        this.canvas.height = 550; // Default height

        // Initialize ball
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            dx: Math.random() < 0.5 ? 6 : -6,
            dy: Math.random() < 0.5 ? 1 : -1,
            v: 1.2,
            color: 'white'
        };

        // init paddleA
        this.paddleA = {
            width: 10,
            height: 80,
            x: 5,
            y: this.ball.y - 25,
            score: 0,
            speed: 10,
            color: this.gameState.playerA.color
        };

        // init paddleB
        this.paddleB = {
            width: 10,
            height: 80,
            x: this.canvas.width - ( this.paddleA.x + this.paddleA.width ),
            y: this.ball.y - ( this.paddleA.height / 2 ),
            score: 0,
            speed: 10,
            color: this.gameState.playerB.color
        };
        this.renderGame();
        this.startGameLoop();
        this.attachKeyboardListeners();
    }

    private setInitialGameLayout(): void {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.dx =  Math.random() < 0.5 ? 6 : -6;
        this.ball.dy =  Math.random() < 0.5 ? 1 : -1;
        this.ball.v = 1.2;

        this.paddleA.x = 5;
        this.paddleA.y = this.ball.y - 25,

        this.paddleB.x = this.canvas.width - ( this.paddleA.x + this.paddleA.width );
        this.paddleB.y = this.ball.y - ( this.paddleA.height / 2 )
    }

    private notifyScoreUpdate(): void {
        if (this.onScoreUpdate) {
            this.onScoreUpdate(this.paddleA.score, this.paddleB.score);
        }
    }

    private attachKeyboardListeners(): void {
        window.addEventListener('keydown', (event: KeyboardEvent) => {
        this.keys[event.key] = true; // Mark the key as pressed
        });

        window.addEventListener('keyup', (event: KeyboardEvent) => {
        this.keys[event.key] = false; // Mark the key as released
        });
    }

    private drawBall(): void {
        this.ctx.fillStyle = this.ball.color;
        this.ctx.fillRect(this.ball.x, this.ball.y, 10, 10);
    }

    private drawPaddles(): void {
        this.ctx.fillStyle = this.paddleA.color;
        // draw paddle 1
        this.ctx.fillRect(this.paddleA.x, this.paddleA.y, this.paddleA.width, this.paddleA.height);
        this.ctx.fillStyle = this.paddleB.color;
        // draw paddle 2
        this.ctx.fillRect(this.paddleB.x, this.paddleB.y, this.paddleB.width, this.paddleB.height);
    }

    private startGameLoop(): void {
        const gameLoop = () => {
            this.updateGameState(); // Update game logic
            this.renderGame(); // Render the game state to the canvas
            this.animationFrameId = requestAnimationFrame(gameLoop); // Continue the loop
        };
        this.animationFrameId = requestAnimationFrame(gameLoop); // Start the loop
    }

    private stopGameLoop(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId); // Stop the loop
            this.animationFrameId = null;
        }
    }

    private updateGameState(): void {
        // paddle stuff
        if (this.keys['w']) {
            this.paddleA.y -= this.paddleA.speed;
        }
        if (this.keys['s']) {
            this.paddleA.y += this.paddleA.speed;
        }
        if (this.keys['ArrowUp']) {
            this.paddleB.y -= this.paddleB.speed;
        }
        if (this.keys['ArrowDown']) {
            this.paddleB.y += this.paddleB.speed;
        }

        this.paddleA.y = Math.max(5, Math.min(this.paddleA.y, (this.canvas.height - this.paddleA.height - 5)));
        this.paddleB.y = Math.max(5, Math.min(this.paddleB.y, (this.canvas.height - this.paddleB.height - 5)));

        // ball movement
        this.ball.x += this.ball.v * this.ball.dx;
        this.ball.y += this.ball.v * this.ball.dy;

        // ball collision with top and bottom walls
        if (this.ball.y <= 0 || this.ball.y >= this.canvas.height - 10) {
            this.ball.dy *= -1; // Reverse vertical direction
        }

        // ball collision with side walls (score update logic)
        if (this.ball.x <= 0) {
            this.paddleB.score += 1; // Player B scores
            this.notifyScoreUpdate(); // Notify parent about score change
            this.setInitialGameLayout();
            return;
        }

        if (this.ball.x >= this.canvas.width - 10) {
            this.paddleA.score += 1; // Player A scores
            this.notifyScoreUpdate(); // Notify parent about score change
            this.setInitialGameLayout();
            return;
        }

        // ball collision with paddles
        // paddle A
        if (
            this.ball.x <= this.paddleA.x + this.paddleA.width && // Ball is at paddle A's x range
            this.ball.y >= this.paddleA.y && // Ball is within paddle A's top boundary
            this.ball.y <= this.paddleA.y + this.paddleA.height // Ball is within paddle A's bottom boundary
        ) {
            this.ball.dx *= -1; // Reverse horizontal direction
            // y reverse in random direction
            this.ball.dy *= Math.random() < 0.5 ? 1 : -1; // reverse Y dir
            this.ball.dy += Math.random() < 0.5 ? 0.1 : -0.1; // random little bit extra on Y dir
            this.ball.x = this.paddleA.x + this.paddleA.width; // Prevent sticking
            if (this.ball.v < 2.5)
                this.ball.v += 0.05;
        }
        // paddle B
        if (
            this.ball.x >= this.paddleB.x - 10 && // Ball is at paddle B's x range
            this.ball.y >= this.paddleB.y && // Ball is within paddle B's top boundary
            this.ball.y <= this.paddleB.y + this.paddleB.height // Ball is within paddle B's bottom boundary
        ) {
            this.ball.dx *= -1; // Reverse horizontal direction
            this.ball.dy *= Math.random() < 0.5 ? 1 : -1; // reverse Y dir
            this.ball.dy += Math.random() < 0.5 ? 0.1 : -0.1; // random little bit extra on Y dir
            this.ball.x = this.paddleB.x - 10; // Prevent sticking
            if (this.ball.v < 2.5)
                this.ball.v += 0.05;
        }
    }

    // game loop logic
    private renderGame(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBall();
        this.drawPaddles();
    }

    public mount(parent: HTMLElement): void {
        // Append the window element instead of just the canvas
        parent.appendChild(this.windowElement);
    }

    public unmount(): void {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.stopGameLoop();
        this.windowElement.remove();
    }
}