import { PONG_CONFIG, GameSessionStatus, Direction, PaddleName, BOARD_DEFAULTS, PADDLE_DEFAULTS, BALL_DEFAULTS } from '../../../constants/game.constants.js';
import type { GameState } from '../../../schemas/game.schema.js';

export function initializeGameState(gameId: string): GameState {
  const gameState: GameState = {
    gameId,
    ball: {
      x: BOARD_DEFAULTS.width / 2 - BALL_DEFAULTS.size / 2,
      y: BOARD_DEFAULTS.height / 2 - BALL_DEFAULTS.size / 2,
      dx: BALL_DEFAULTS.dx,
      dy: BALL_DEFAULTS.dy,
      v: BALL_DEFAULTS.v,
    },
    paddleA: {
      width: PADDLE_DEFAULTS.width,
      height: PADDLE_DEFAULTS.height,
      x: PADDLE_DEFAULTS.offset,
      y: BOARD_DEFAULTS.height / 2 - PADDLE_DEFAULTS.height / 2,
      score: PADDLE_DEFAULTS.score,
      speed: PADDLE_DEFAULTS.speed,
      direction: Direction.STOP,
      isAI: false,
    },
    paddleB: {
      width: PADDLE_DEFAULTS.width,
      height: PADDLE_DEFAULTS.height,
      x: BOARD_DEFAULTS.width - (PADDLE_DEFAULTS.offset + PADDLE_DEFAULTS.width),
      y: BOARD_DEFAULTS.height / 2 - PADDLE_DEFAULTS.height / 2,
      score: PADDLE_DEFAULTS.score,
      speed: PADDLE_DEFAULTS.speed,
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

  paddleA.y = Math.max(
    0,
    Math.min(paddleA.y, BOARD_DEFAULTS.height - paddleA.height - PADDLE_DEFAULTS.offset),
  );
  paddleB.y = Math.max(
    0,
    Math.min(paddleB.y, BOARD_DEFAULTS.height - paddleB.height - PADDLE_DEFAULTS.offset),
  );

  ball.x += ball.v * ball.dx * deltaTime;
  ball.y += ball.v * ball.dy * deltaTime;

  if (ball.y <= 0 || ball.y >= BOARD_DEFAULTS.height - BALL_DEFAULTS.size) {
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
    ball.dy += (Math.random() - 0.5) * 0.5;
    ball.dy *= Math.random() < 0.5 ? -1 : 1;
  }
  if (
    ball.x >= paddleB.x - BALL_DEFAULTS.size &&
    ball.y >= paddleB.y &&
    ball.y <= paddleB.y + paddleB.height
  ) {
    ball.x = paddleB.x - BALL_DEFAULTS.size;
    ball.dx = -Math.abs(ball.dx);
    ball.v += PONG_CONFIG.INCREMENT_BALL_VELOCITY;
    ball.dy += (Math.random() - 0.5) * 0.5;
    ball.dy *= Math.random() < 0.5 ? -1 : 1;
  }

  if (ball.dy > PONG_CONFIG.MAX_BALL_DY) ball.dy = PONG_CONFIG.MAX_BALL_DY;
  if (ball.dy < -PONG_CONFIG.MAX_BALL_DY) ball.dy = -PONG_CONFIG.MAX_BALL_DY;
}

function resetBall(state: GameState): void {
  const { ball } = state;
  ball.x = BOARD_DEFAULTS.width / 2;
  ball.y = BOARD_DEFAULTS.height / 2;
  ball.dx = Math.random() < 0.5 ? 6 : -6;
  ball.dy = Math.random() < 0.5 ? 1 : -1;
  ball.v = BALL_DEFAULTS.v;
}

function resetPadlesPosition(state: GameState): void {
  state.paddleA.y = BOARD_DEFAULTS.height / 2 - PADDLE_DEFAULTS.height / 2;
  state.paddleB.y = BOARD_DEFAULTS.height / 2 - PADDLE_DEFAULTS.height / 2;
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
