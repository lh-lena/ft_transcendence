import { Ball } from '../types';
import { Paddle } from '../types';
import { GameState, GameStatus } from '../types';
import { BALL_DEFAULTS, PADDLE_A_DEFAULTS, PADDLE_B_DEFAULTS, CANVAS_DEFAULTS } from '../types';

export class PongGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onScoreUpdate: ((scoreA: number, scoreB: number) => void) | null = null;
  private gameState: GameState;
  private lastFrameTime: number = performance.now();
  private bgColor: string;

  // added ! so they dont need to be initialized directly in the constructor
  private ball!: Ball;
  private paddleA!: Paddle;
  private paddleB!: Paddle;

  private keys: { [key: string]: boolean } = {};

  private animationFrameId: number | null = null;
  private windowElement: HTMLDivElement;

  private pauseCallback?: () => void;

  constructor(
    gameState: GameState,
    onScoreUpdate?: (scoreA: number, scoreB: number) => void,
    pauseCallback?: () => void,
  ) {
    this.gameState = gameState;
    // score callback for localGamePage
    if (onScoreUpdate) {
      this.onScoreUpdate = onScoreUpdate;
    }
    // pause call back for localGamePage
    if (pauseCallback) {
      this.pauseCallback = pauseCallback;
    }
    // Create window structure
    this.windowElement = document.createElement('div');
    this.windowElement.className = 'window border-2';

    this.bgColor = '#182245';

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
    this.canvas.style.backgroundColor = this.bgColor;

    // Add canvas to the window content area
    contentArea.appendChild(this.canvas);

    // Get context for drawing
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');
    this.ctx = context;

    // Set initial canvas size
    this.canvas.width = CANVAS_DEFAULTS.width;
    this.canvas.height = CANVAS_DEFAULTS.height;

    // Initialize ball
    // clone object
    this.ball = { ...BALL_DEFAULTS };

    // init paddleA
    this.paddleA = { ...PADDLE_A_DEFAULTS };
    this.paddleA.color = gameState.playerA.color;

    // init paddleB
    this.paddleB = { ...PADDLE_B_DEFAULTS };
    this.paddleB.color = gameState.playerB.color;

    this.attachKeyboardListeners();
    this.startGameLoop();
  }

  private setInitialGameLayout(): void {
    this.ball.x = BALL_DEFAULTS.x;
    this.ball.y = BALL_DEFAULTS.y;
    this.ball.dx = Math.random() < 0.5 ? 6 : -6;
    this.ball.dy = Math.random() < 0.5 ? 1 : -1;
    this.ball.v = BALL_DEFAULTS.v;

    // no need to change paddles back to org pos
    // this.paddleA.y = this.ball.y - 25,
    // this.paddleB.y = this.ball.y - ( this.paddleA.height / 2 )
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
    this.ctx.fillRect(this.ball.x, this.ball.y, this.ball.size, this.ball.size);
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
    const gameLoop = (now: number) => {
      const dt = (now - this.lastFrameTime) / 1000;
      this.lastFrameTime = now;
      this.updateGameState(dt); // Update game logic
      this.renderGame(); // Render the game state to the canvas
      this.animationFrameId = requestAnimationFrame(gameLoop); // Continue the loop
    };
    this.lastFrameTime = performance.now();
    this.animationFrameId = requestAnimationFrame(gameLoop); // Start the loop
  }

  private stopGameLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId); // Stop the loop
      this.animationFrameId = null;
    }
  }

  public hideGamePieces(): void {
    this.paddleA.color = this.bgColor;
    this.paddleB.color = this.bgColor;
    this.ball.color = this.bgColor;
  }

  public showGamePieces(): void {
    this.paddleA.color = this.gameState.playerA.color;
    this.paddleB.color = this.gameState.playerB.color;
    this.ball.color = BALL_DEFAULTS.color;
  }

  private updateGameState(dt: number): void {
    // callback to update pause play in localGamePage
    if (this.pauseCallback) {
      this.pauseCallback();
    }
    // if game is paused return
    if (this.gameState.status !== GameStatus.PLAYING) {
      console.log('here?');
      this.hideGamePieces();
      return;
    }

    // --- Paddle Movement ---
    if (this.keys['w']) {
      this.paddleA.y -= this.paddleA.speed * dt;
    }
    if (this.keys['s']) {
      this.paddleA.y += this.paddleA.speed * dt;
    }
    if (this.keys['ArrowUp']) {
      this.paddleB.y -= this.paddleB.speed * dt;
    }
    if (this.keys['ArrowDown']) {
      this.paddleB.y += this.paddleB.speed * dt;
    }

    // Clamp paddles within canvas
    this.paddleA.y = Math.max(
      5,
      Math.min(this.paddleA.y, this.canvas.height - this.paddleA.height - 5),
    );
    this.paddleB.y = Math.max(
      5,
      Math.min(this.paddleB.y, this.canvas.height - this.paddleB.height - 5),
    );

    // --- Ball Movement ---
    this.ball.x += this.ball.v * this.ball.dx * dt;
    this.ball.y += this.ball.v * this.ball.dy * dt;

    // --- Ball Collision: Top/Bottom Walls ---
    if (this.ball.y <= 0) {
      this.ball.y = 0;
      this.ball.dy *= -1;
    }
    if (this.ball.y >= this.canvas.height - this.ball.size) {
      this.ball.y = this.canvas.height - this.ball.size;
      this.ball.dy *= -1;
    }

    // --- Ball Collision: Left/Right Walls (Scoring) ---
    if (this.ball.x <= 0) {
      this.paddleB.score += 1;
      this.notifyScoreUpdate();
      this.setInitialGameLayout();
      return;
    }
    if (this.ball.x >= this.canvas.width - this.ball.size) {
      this.paddleA.score += 1;
      this.notifyScoreUpdate();
      this.setInitialGameLayout();
      return;
    }

    // --- Ball Collision: Paddle A ---
    if (
      this.ball.x <= this.paddleA.x + this.paddleA.width &&
      this.ball.x + this.ball.size >= this.paddleA.x &&
      this.ball.y + this.ball.size >= this.paddleA.y &&
      this.ball.y <= this.paddleA.y + this.paddleA.height
    ) {
      this.ball.x = this.paddleA.x + this.paddleA.width; // Prevent sticking
      this.ball.dx = Math.abs(this.ball.dx); // Always bounce right
      // Acceleration logic
      this.ball.v += BALL_DEFAULTS.acceleration;
      // random y
      this.ball.dy += (Math.random() - 0.5) * 0.5;
      this.ball.dy *= Math.random() < 0.5 ? -1 : 1;
    }

    // --- Ball Collision: Paddle B ---
    if (
      this.ball.x + this.ball.size >= this.paddleB.x &&
      this.ball.x <= this.paddleB.x + this.paddleB.width &&
      this.ball.y + this.ball.size >= this.paddleB.y &&
      this.ball.y <= this.paddleB.y + this.paddleB.height
    ) {
      this.ball.x = this.paddleB.x - this.ball.size; // Prevent sticking
      this.ball.dx = -Math.abs(this.ball.dx); // Always bounce left
      // acceleration
      this.ball.v += BALL_DEFAULTS.acceleration;
      // random y
      this.ball.dy += (Math.random() - 0.5) * 0.5;
      this.ball.dy *= Math.random() < 0.5 ? -1 : 1;
    }

    // Limit ball.dy to prevent vertical lock ---
    const maxDY = 2.5;
    if (this.ball.dy > maxDY) this.ball.dy = maxDY;
    if (this.ball.dy < -maxDY) this.ball.dy = -maxDY;
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
