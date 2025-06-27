import { Ball } from '../types/game';
import { Paddle } from '../types/game';

export class PongGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private ball: Ball;
    private paddleA: Paddle;
    private paddleB: Paddle;
    private animationFrameId: number | null = null;
    private ballColor: string = '#0400FF'; // Match CSS variable
    private windowElement: HTMLDivElement;
    
    constructor() {        
        // Create window structure
        this.windowElement = document.createElement('div');
        this.windowElement.className = 'window';
        
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
        this.canvas.style.backgroundColor = '#ffffffff'; 

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
            y: this.canvas.height / 2
        };

        // init paddleA
        this.paddleA = {
            width: 10,
            height: 50,
            x: 5,
            y: this.ball.y - 25,
            score: 0
        };

        // init paddleB
        this.paddleB = {
            width: 10,
            height: 50,
            x: this.canvas.width - ( this.paddleA.x + this.paddleA.width ),
            y: this.ball.y - ( this.paddleA.height / 2 ),
            score: 0
        };

        this.renderGame();

    }

    private drawBall(): void {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(this.ball.x, this.ball.y, 10, 10);
    }

    private drawPaddles(): void {
        this.ctx.fillStyle = "black";
        // draw paddle 1
        this.ctx.fillRect(this.paddleA.x, this.paddleA.y, this.paddleA.width, this.paddleA.height);
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
        // Update game logic here (e.g., move ball, check collisions)
        // Example: Move the ball, check for paddle collisions, etc.
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
        this.windowElement.remove();
    }
}