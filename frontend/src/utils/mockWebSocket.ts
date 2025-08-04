// Mock WebSocket implementation for ft_transcendence
// Simulates the WebSocket protocol defined in the documentation

export enum Direction {
  UP = -1,
  DOWN = 1,
  STOP = 0
}

export enum GameSessionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  FINISHED = 'finished',
  CANCELLED = 'cancelled',
  CANCELLED_SERVER_ERROR = 'cancelled_server_error',
}

export enum GameMode {
  PVP_REMOTE = 'pvp_remote',
  PVP_LOCAL = 'pvp_local',
  PVB_AI = 'pvb_ai',
}

export enum AIDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export interface GameState {
  gameId: string;
  ball: { x: number; y: number; dx: number; dy: number; v: number; };
  paddleA: { width: number; height: number; x: number; y: number; score: number; speed: number; direction: Direction; };
  paddleB: { width: number; height: number; x: number; y: number; score: number; speed: number; direction: Direction; };
  activePaddle?: string;
  status: GameSessionStatus;
  countdown: number;
  sequence: number;
}

export interface PlayerInput {
  direction: Direction;
  sequence: number;
}

export interface ChatMessage {
  userId: number;
  username: string;
  recipientId?: number;
  message: string;
  timestamp: string;
}

export interface NotificationPayload {
  type: 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
}

export interface GameResult {
  gameId: string;
  scorePlayer1: number;
  scorePlayer2: number;
  winnerId: number | null;
  loserId: number | null;
  player1Username: string | null;
  player2Username: string | null;
  status: GameSessionStatus.FINISHED | GameSessionStatus.CANCELLED | GameSessionStatus.CANCELLED_SERVER_ERROR;
  startedAt: string;
  finishedAt: string;
}

export interface User {
  userId: number;
  username: string;
  userAlias: string;
}

// Client message types
export interface WsClientMessage {
  'game_start': { gameId: string };
  'game_leave': { gameId: string };
  'game_update': PlayerInput;
  'game_pause': { gameId: string };
  'game_resume': { gameId: string };
  'chat_message': ChatMessage;
  'notification': NotificationPayload;
}

// Server broadcast types
export interface WsServerBroadcast {
  'connected': { userId: number };
  'game_update': GameState;
  'game_ended': GameResult;
  'game_pause': { gameId: string, reason: string };
  'countdown_update': { gameId: string, countdown: number, message: string };
  'chat_message': ChatMessage;
  'notification': NotificationPayload;
  'error': { message: string };
}

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
  COUNTDOWN: 3
};

type EventListener<T = unknown> = (event: MessageEvent<T>) => void;

export class MockWebSocket {
  private eventListeners: Map<string, EventListener[]> = new Map();
  private _readyState: number = WebSocket.CONNECTING;
  private _url: string;
  private gameState: GameState | null = null;
  private gameInterval: NodeJS.Timeout | null = null;
  private countdownInterval: NodeJS.Timeout | null = null;
  private sequence: number = 0;
  private currentGameId: string | null = null;

  // WebSocket constants
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  // Event handlers (can be set directly like real WebSocket)
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this._url = url;
    
    // Simulate connection delay
    setTimeout(() => {
      this._readyState = WebSocket.OPEN;
      const openEvent = new Event('open');
      this.onopen?.(openEvent);
      this.dispatchEvent('open', openEvent);
      
      // Send connected message
      this.simulateServerMessage('connected', { userId: 1 });
    }, 100);
  }

  get readyState(): number {
    return this._readyState;
  }

  get url(): string {
    return this._url;
  }

  // Send message from client to server
  send(data: string | ArrayBuffer | Blob): void {
    if (this._readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }

    try {
      const message = JSON.parse(data as string);
      this.handleClientMessage(message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      this.simulateServerMessage('error', { message: 'Invalid message format' });
    }
  }

  // Handle incoming client messages and simulate server responses
  private handleClientMessage(message: { event: keyof WsClientMessage; payload: unknown }): void {
    const { event, payload } = message;

    switch (event) {
      case 'game_start':
        this.handleGameStart((payload as { gameId: string }).gameId);
        break;
      
      case 'game_update':
        this.handleGameUpdate(payload as PlayerInput);
        break;
      
      case 'game_pause':
        this.handleGamePause((payload as { gameId: string }).gameId);
        break;
      
      case 'game_resume':
        this.handleGameResume((payload as { gameId: string }).gameId);
        break;
      
      case 'game_leave':
        this.handleGameLeave((payload as { gameId: string }).gameId);
        break;
      
      case 'chat_message':
        this.handleChatMessage(payload as ChatMessage);
        break;
      
      case 'notification':
        this.simulateServerMessage('notification', payload as NotificationPayload);
        break;
      
      default:
        this.simulateServerMessage('error', { message: `Unknown event: ${event}` });
    }
  }

  private handleGameStart(gameId: string): void {
    this.currentGameId = gameId;
    this.sequence = 0;
    
    // Initialize game state
    this.gameState = {
      gameId,
      ball: {
        x: PONG_CONFIG.BOARD_WIDTH / 2,
        y: PONG_CONFIG.BOARD_HEIGHT / 2,
        dx: PONG_CONFIG.INITIAL_BALL_SPEED_X,
        dy: PONG_CONFIG.INITIAL_BALL_SPEED_Y,
        v: PONG_CONFIG.INITIAL_BALL_VELOCITY
      },
      paddleA: {
        width: PONG_CONFIG.PADDLE_WIDTH,
        height: PONG_CONFIG.PADDLE_HEIGHT,
        x: PONG_CONFIG.PADDLE_OFFSET,
        y: PONG_CONFIG.BOARD_HEIGHT / 2 - PONG_CONFIG.PADDLE_HALF_HEIGHT,
        score: 0,
        speed: PONG_CONFIG.PADDLE_SPEED,
        direction: Direction.STOP
      },
      paddleB: {
        width: PONG_CONFIG.PADDLE_WIDTH,
        height: PONG_CONFIG.PADDLE_HEIGHT,
        x: PONG_CONFIG.BOARD_WIDTH - PONG_CONFIG.PADDLE_OFFSET - PONG_CONFIG.PADDLE_WIDTH,
        y: PONG_CONFIG.BOARD_HEIGHT / 2 - PONG_CONFIG.PADDLE_HALF_HEIGHT,
        score: 0,
        speed: PONG_CONFIG.PADDLE_SPEED,
        direction: Direction.STOP
      },
      status: GameSessionStatus.PENDING,
      countdown: PONG_CONFIG.COUNTDOWN,
      sequence: this.sequence
    };

    // Start countdown
    this.startCountdown();
  }

  private startCountdown(): void {
    if (!this.gameState) return;

    let countdown = PONG_CONFIG.COUNTDOWN;
    
    this.countdownInterval = setInterval(() => {
      if (!this.gameState) return;

      if (countdown > 0) {
        this.simulateServerMessage('countdown_update', {
          gameId: this.gameState.gameId,
          countdown,
          message: `Game starts in ${countdown}...`
        });
        countdown--;
      } else {
        this.simulateServerMessage('countdown_update', {
          gameId: this.gameState.gameId,
          countdown: 0,
          message: 'GO!'
        });
        
        // Start the game
        this.gameState.status = GameSessionStatus.ACTIVE;
        this.gameState.countdown = 0;
        this.startGameLoop();
        
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
          this.countdownInterval = null;
        }
      }
    }, 1000);
  }

  private startGameLoop(): void {
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
    }

    this.gameInterval = setInterval(() => {
      if (!this.gameState || this.gameState.status !== GameSessionStatus.ACTIVE) {
        return;
      }

      this.updateGameState();
      this.simulateServerMessage('game_update', { ...this.gameState });
    }, 1000 / PONG_CONFIG.FPS);
  }

  private updateGameState(): void {
    if (!this.gameState) return;

    // Update paddle positions based on direction
    const deltaTime = 1 / PONG_CONFIG.FPS;
    
    // Update paddle A
    if (this.gameState.paddleA.direction !== Direction.STOP) {
      const newY = this.gameState.paddleA.y + 
        (this.gameState.paddleA.direction * this.gameState.paddleA.speed * deltaTime);
      this.gameState.paddleA.y = Math.max(0, 
        Math.min(PONG_CONFIG.BOARD_HEIGHT - PONG_CONFIG.PADDLE_HEIGHT, newY));
    }

    // Update paddle B
    if (this.gameState.paddleB.direction !== Direction.STOP) {
      const newY = this.gameState.paddleB.y + 
        (this.gameState.paddleB.direction * this.gameState.paddleB.speed * deltaTime);
      this.gameState.paddleB.y = Math.max(0, 
        Math.min(PONG_CONFIG.BOARD_HEIGHT - PONG_CONFIG.PADDLE_HEIGHT, newY));
    }

    // Update ball position
    this.gameState.ball.x += this.gameState.ball.dx;
    this.gameState.ball.y += this.gameState.ball.dy;

    // Ball collision with top/bottom walls
    if (this.gameState.ball.y <= 0 || this.gameState.ball.y >= PONG_CONFIG.BOARD_HEIGHT - PONG_CONFIG.BALL_SIZE) {
      this.gameState.ball.dy = -this.gameState.ball.dy;
    }

    // Ball collision with paddles (simplified)
    if (this.gameState.ball.x <= PONG_CONFIG.PADDLE_OFFSET + PONG_CONFIG.PADDLE_WIDTH) {
      if (this.gameState.ball.y >= this.gameState.paddleA.y && 
          this.gameState.ball.y <= this.gameState.paddleA.y + PONG_CONFIG.PADDLE_HEIGHT) {
        this.gameState.ball.dx = -this.gameState.ball.dx;
      }
    }

    if (this.gameState.ball.x >= PONG_CONFIG.BOARD_WIDTH - PONG_CONFIG.PADDLE_OFFSET - PONG_CONFIG.PADDLE_WIDTH - PONG_CONFIG.BALL_SIZE) {
      if (this.gameState.ball.y >= this.gameState.paddleB.y && 
          this.gameState.ball.y <= this.gameState.paddleB.y + PONG_CONFIG.PADDLE_HEIGHT) {
        this.gameState.ball.dx = -this.gameState.ball.dx;
      }
    }

    // Score detection
    if (this.gameState.ball.x < 0) {
      this.gameState.paddleB.score++;
      this.resetBall();
    } else if (this.gameState.ball.x > PONG_CONFIG.BOARD_WIDTH) {
      this.gameState.paddleA.score++;
      this.resetBall();
    }

    // Check for game end
    if (this.gameState.paddleA.score >= PONG_CONFIG.MAX_SCORE || 
        this.gameState.paddleB.score >= PONG_CONFIG.MAX_SCORE) {
      this.endGame();
    }

    this.gameState.sequence++;
  }

  private resetBall(): void {
    if (!this.gameState) return;

    this.gameState.ball.x = PONG_CONFIG.BOARD_WIDTH / 2;
    this.gameState.ball.y = PONG_CONFIG.BOARD_HEIGHT / 2;
    this.gameState.ball.dx = PONG_CONFIG.INITIAL_BALL_SPEED_X * (Math.random() > 0.5 ? 1 : -1);
    this.gameState.ball.dy = PONG_CONFIG.INITIAL_BALL_SPEED_Y * (Math.random() > 0.5 ? 1 : -1);
  }

  private endGame(): void {
    if (!this.gameState) return;

    this.gameState.status = GameSessionStatus.FINISHED;
    
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }

    const winnerId = this.gameState.paddleA.score > this.gameState.paddleB.score ? 1 : 2;
    const loserId = winnerId === 1 ? 2 : 1;

    const gameResult: GameResult = {
      gameId: this.gameState.gameId,
      scorePlayer1: this.gameState.paddleA.score,
      scorePlayer2: this.gameState.paddleB.score,
      winnerId,
      loserId,
      player1Username: 'Player 1',
      player2Username: 'Player 2',
      status: GameSessionStatus.FINISHED,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString()
    };

    this.simulateServerMessage('game_ended', gameResult);
  }

  private handleGameUpdate(playerInput: PlayerInput): void {
    if (!this.gameState || this.gameState.status !== GameSessionStatus.ACTIVE) return;

    // Update paddle A direction (assuming this is the player's paddle)
    this.gameState.paddleA.direction = playerInput.direction;
  }

  private handleGamePause(gameId: string): void {
    if (!this.gameState || this.gameState.gameId !== gameId) return;

    this.gameState.status = GameSessionStatus.PAUSED;
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }

    this.simulateServerMessage('game_pause', { gameId, reason: 'Player requested pause' });
  }

  private handleGameResume(gameId: string): void {
    if (!this.gameState || this.gameState.gameId !== gameId) return;

    this.gameState.status = GameSessionStatus.ACTIVE;
    this.startGameLoop();
  }

  private handleGameLeave(gameId: string): void {
    if (!this.gameState || this.gameState.gameId !== gameId) return;

    this.gameState.status = GameSessionStatus.CANCELLED;
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    const gameResult: GameResult = {
      gameId: this.gameState.gameId,
      scorePlayer1: this.gameState.paddleA.score,
      scorePlayer2: this.gameState.paddleB.score,
      winnerId: null,
      loserId: null,
      player1Username: 'Player 1',
      player2Username: 'Player 2',
      status: GameSessionStatus.CANCELLED,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString()
    };

    this.simulateServerMessage('game_ended', gameResult);
  }

  private handleChatMessage(chatMessage: ChatMessage): void {
    // Echo the chat message back (simulate broadcast)
    this.simulateServerMessage('chat_message', chatMessage);
  }

  // Simulate receiving a message from the server
  private simulateServerMessage<K extends keyof WsServerBroadcast>(
    event: K, 
    payload: WsServerBroadcast[K]
  ): void {
    const message = { event, payload };
    const messageEvent = new MessageEvent('message', {
      data: JSON.stringify(message)
    });

    // Call onmessage handler if set
    this.onmessage?.(messageEvent);
    
    // Call event listeners
    this.dispatchEvent('message', messageEvent);
  }

  // Event listener management
  addEventListener(type: string, listener: EventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private dispatchEvent(type: string, event: Event): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => listener(event as MessageEvent));
    }
  }

  // Close the connection
  close(code?: number, reason?: string): void {
    if (this._readyState === WebSocket.CLOSED || this._readyState === WebSocket.CLOSING) {
      return;
    }

    this._readyState = WebSocket.CLOSING;

    // Clean up intervals
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    setTimeout(() => {
      this._readyState = WebSocket.CLOSED;
      const closeEvent = new CloseEvent('close', { code: code || 1000, reason: reason || '' });
      this.onclose?.(closeEvent);
      this.dispatchEvent('close', closeEvent);
    }, 100);
  }

  // Utility methods for testing
  
  // Manually trigger server events for testing
  triggerServerEvent<K extends keyof WsServerBroadcast>(
    event: K, 
    payload: WsServerBroadcast[K]
  ): void {
    this.simulateServerMessage(event, payload);
  }

  // Get current game state for testing
  getGameState(): GameState | null {
    return this.gameState;
  }

  // Set AI opponent for single player testing
  enableAIOpponent(difficulty: AIDifficulty = AIDifficulty.MEDIUM): void {
    if (!this.gameState) return;

    // Simple AI logic for paddle B
    const aiInterval = setInterval(() => {
      if (!this.gameState || this.gameState.status !== GameSessionStatus.ACTIVE) {
        clearInterval(aiInterval);
        return;
      }

      const paddleCenter = this.gameState.paddleB.y + PONG_CONFIG.PADDLE_HALF_HEIGHT;
      const ballY = this.gameState.ball.y;
      
      let accuracy = 0.75; // Medium difficulty
      if (difficulty === AIDifficulty.EASY) accuracy = 0.6;
      if (difficulty === AIDifficulty.HARD) accuracy = 0.9;

      // Add some randomness based on difficulty
      if (Math.random() > accuracy) return;

      if (ballY < paddleCenter - 10) {
        this.gameState.paddleB.direction = Direction.UP;
      } else if (ballY > paddleCenter + 10) {
        this.gameState.paddleB.direction = Direction.DOWN;
      } else {
        this.gameState.paddleB.direction = Direction.STOP;
      }
    }, difficulty === AIDifficulty.EASY ? 200 : difficulty === AIDifficulty.MEDIUM ? 100 : 50);
  }
}

// Export default for easy importing
export default MockWebSocket;