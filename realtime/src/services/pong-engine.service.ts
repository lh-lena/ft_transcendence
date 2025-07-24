import {
  PONG_CONFIG,
  GameSessionStatus,
  Direction,
} from '../types/game.types.js';
import { GameState } from '../schemas/game.schema.js';

export function initializeGameState(gameId: string): GameState {
  const gameState: GameState = {
    gameId,
    ball: {
      x: PONG_CONFIG.BOARD_WIDTH / 2 - PONG_CONFIG.BALL_SIZE / 2,
      y: PONG_CONFIG.BOARD_HEIGHT / 2 - PONG_CONFIG.BALL_SIZE / 2,
      dx: PONG_CONFIG.INITIAL_BALL_SPEED_X * (Math.random() > 0.5 ? 1 : -1),
      dy: PONG_CONFIG.INITIAL_BALL_SPEED_Y * (Math.random() > 0.5 ? 1 : -1),
      v: PONG_CONFIG.INITIAL_BALL_VELOCITY,
    },
    paddleA: {
      width: PONG_CONFIG.PADDLE_WIDTH,
      height: PONG_CONFIG.PADDLE_HEIGHT,
      x: PONG_CONFIG.PADDLE_OFFSET,
      y: PONG_CONFIG.BOARD_HEIGHT / 2 - PONG_CONFIG.PADDLE_HALF_HEIGHT,
      score: 0,
      speed: PONG_CONFIG.PADDLE_SPEED,
      direction: Direction.STOP,
    },
    paddleB: {
      width: PONG_CONFIG.PADDLE_WIDTH,
      height: PONG_CONFIG.PADDLE_HEIGHT,
      x:
        PONG_CONFIG.BOARD_WIDTH -
        (PONG_CONFIG.PADDLE_OFFSET + PONG_CONFIG.PADDLE_WIDTH),
      y: PONG_CONFIG.BOARD_HEIGHT / 2 - PONG_CONFIG.PADDLE_HALF_HEIGHT,
      score: 0,
      speed: PONG_CONFIG.PADDLE_SPEED,
      direction: Direction.STOP,
    },
    status: GameSessionStatus.PENDING,
    countdown: PONG_CONFIG.COUNTDOWN,
    activePaddle: 'paddleA',
    sequence: 0,
  };
  return gameState;
}

export function updateGame(state: GameState, deltaTime: number): void {
  const { paddleA, paddleB, ball } = state;

  if (paddleA.direction !== Direction.STOP) {
    paddleA.y += paddleA.direction * paddleA.speed * deltaTime;
  }
  if (paddleB.direction !== Direction.STOP) {
    paddleB.y += paddleB.direction * paddleB.speed * deltaTime;
  }

  paddleA.y = Math.max(
    0,
    Math.min(
      paddleA.y,
      PONG_CONFIG.BOARD_HEIGHT - paddleA.height - PONG_CONFIG.PADDLE_OFFSET,
    ),
  );
  paddleB.y = Math.max(
    0,
    Math.min(
      paddleB.y,
      PONG_CONFIG.BOARD_HEIGHT - paddleB.height - PONG_CONFIG.PADDLE_OFFSET,
    ),
  );

  ball.x += ball.v * ball.dx;
  ball.y += ball.v * ball.dy;

  if (
    ball.y <= 0 ||
    ball.y >= PONG_CONFIG.BOARD_HEIGHT - PONG_CONFIG.BALL_SIZE
  ) {
    ball.dy *= -1;
  }

  if (ball.x <= 0) {
    paddleB.score += 1;
    resetBall(state);
    return;
  }
  if (ball.x >= PONG_CONFIG.BOARD_WIDTH - PONG_CONFIG.BALL_SIZE) {
    paddleA.score += 1;
    resetBall(state);
    return;
  }

  if (
    ball.x <= paddleA.x + paddleA.width &&
    ball.y >= paddleA.y &&
    ball.y <= paddleA.y + paddleA.height
  ) {
    ball.dx *= -1;
    ball.dy *= Math.random() < 0.5 ? 1 : -1;
    ball.dy += Math.random() < 0.5 ? 0.1 : -0.1;
    ball.x = paddleA.x + paddleA.width;
    if (ball.v < PONG_CONFIG.MAX_BALL_VELOCITY)
      ball.v += PONG_CONFIG.INCREMENT_BALL_VELOCITY;
  }
  if (
    ball.x >= paddleB.x - PONG_CONFIG.BALL_SIZE &&
    ball.y >= paddleB.y &&
    ball.y <= paddleB.y + paddleB.height
  ) {
    ball.dx *= -1;
    ball.dy *= Math.random() < 0.5 ? 1 : -1;
    ball.dy += Math.random() < 0.5 ? 0.1 : -0.1;
    ball.x = paddleB.x - PONG_CONFIG.BALL_SIZE;
    if (ball.v < PONG_CONFIG.MAX_BALL_VELOCITY)
      ball.v += PONG_CONFIG.INCREMENT_BALL_VELOCITY;
  }
}

function resetBall(state: GameState): void {
  const { ball } = state;
  ball.x = PONG_CONFIG.BOARD_WIDTH / 2;
  ball.y = PONG_CONFIG.BOARD_HEIGHT / 2;
  ball.dx = PONG_CONFIG.INITIAL_BALL_SPEED_X * (Math.random() > 0.5 ? 1 : -1);
  ball.dy = PONG_CONFIG.INITIAL_BALL_SPEED_Y * (Math.random() > 0.5 ? 1 : -1);
  ball.v = PONG_CONFIG.INITIAL_BALL_VELOCITY;
}

export function checkWinCondition(gameState: GameState): boolean {
  if (gameState.paddleA.score >= PONG_CONFIG.MAX_SCORE) {
    gameState.status = GameSessionStatus.FINISHED;
    return true;
  } else if (gameState.paddleB.score >= PONG_CONFIG.MAX_SCORE) {
    gameState.status = GameSessionStatus.FINISHED;
    return true;
  }
  return false;
}
