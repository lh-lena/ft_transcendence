import {
  PONG_CONFIG,
  GameSessionStatus,
  Direction,
  PaddleName,
  BOARD_DEFAULTS,
  BALL_DEFAULTS,
  PADDLE_DEFAULTS,
  PADDLE_A_DEFAULTS,
  PADDLE_B_DEFAULTS,
} from '../../../constants/game.constants.js';
import type { GameState } from '../../../schemas/game.schema.js';

export function initializeGameState(gameId: string): GameState {
  const gameState: GameState = {
    gameId,
    ball: {
      ...BALL_DEFAULTS,
    },
    paddleA: {
      ...PADDLE_A_DEFAULTS,
      direction: Direction.STOP,
      isAI: false,
    },
    paddleB: {
      ...PADDLE_B_DEFAULTS,
      direction: Direction.STOP,
      isAI: false,
    },
    status: GameSessionStatus.PENDING,
    countdown: PONG_CONFIG.COUNTDOWN,
    activePaddle: PaddleName.PADDLE_A,
    sequence: 0,
  };
  return gameState;
}

export function resetGameState(gameState: GameState): void {
  resetBall(gameState);
  resetPadlesPosition(gameState);
}

export function updateGame(state: GameState, deltaTime: number): void {
  const { paddleA, paddleB, ball } = state;

  if (paddleA.direction !== Direction.STOP) {
    paddleA.y += paddleA.direction * paddleA.speed * deltaTime;
  }
  if (paddleB.direction !== Direction.STOP) {
    paddleB.y += paddleB.direction * paddleB.speed * deltaTime;
  }

  paddleA.y = Math.max(0, Math.min(paddleA.y, BOARD_DEFAULTS.height - PADDLE_DEFAULTS.height));
  paddleB.y = Math.max(0, Math.min(paddleB.y, BOARD_DEFAULTS.height - PADDLE_DEFAULTS.height));

  ball.x += ball.v * ball.dx * deltaTime;
  ball.y += ball.v * ball.dy * deltaTime;

  if (ball.y <= 0) {
    ball.y = 0;
    ball.dy *= -1;
  }
  if (ball.y >= BOARD_DEFAULTS.height - BALL_DEFAULTS.size) {
    ball.y = BOARD_DEFAULTS.height - BALL_DEFAULTS.size;
    ball.dy *= -1;
  }

  if (ball.x <= 0) {
    paddleB.score += 1;
    resetBall(state);
    return;
  }
  if (ball.x >= BOARD_DEFAULTS.width - BALL_DEFAULTS.size) {
    paddleA.score += 1;
    resetBall(state);
    return;
  }

  if (
    ball.x <= paddleA.x + paddleA.width &&
    ball.y >= paddleA.y &&
    ball.y <= paddleA.y + paddleA.height
  ) {
    ball.x = paddleA.x + paddleA.width;
    ball.dx = Math.abs(ball.dx);
    ball.v += PONG_CONFIG.INCREMENT_BALL_VELOCITY;
    ball.dy = randomizeBallDirection(ball.dy);
  }
  if (
    ball.x >= paddleB.x - BALL_DEFAULTS.size &&
    ball.y >= paddleB.y &&
    ball.y <= paddleB.y + paddleB.height
  ) {
    ball.x = paddleB.x - BALL_DEFAULTS.size;
    ball.dx = -Math.abs(ball.dx);
    ball.v += PONG_CONFIG.INCREMENT_BALL_VELOCITY;
    ball.dy = randomizeBallDirection(ball.dy);
  }

  if (ball.dy > PONG_CONFIG.MAX_BALL_DY) ball.dy = PONG_CONFIG.MAX_BALL_DY;
  if (ball.dy < -PONG_CONFIG.MAX_BALL_DY) ball.dy = -PONG_CONFIG.MAX_BALL_DY;
}

function resetBall(state: GameState): void {
  state.ball = {
    ...BALL_DEFAULTS,
    dx: Math.random() < 0.5 ? 6 : -6,
    dy: Math.random() < 0.5 ? 1 : -1,
  };
}

export function randomizeBallDirection(dy: number): number {
  let new_dv = dy;
  new_dv += (Math.random() - 0.5) * 0.5;
  new_dv *= Math.random() < 0.5 ? -1 : 1;
  return new_dv;
}

function resetPadlesPosition(state: GameState): void {
  state.paddleA.y = PADDLE_A_DEFAULTS.y;
  state.paddleB.y = PADDLE_B_DEFAULTS.y;
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
