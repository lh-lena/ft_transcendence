import type { Paddle, BallType } from '../schemas/game.schema.js';
import { BALL_DEFAULTS, BOARD_DEFAULTS } from '../constants/game.constants.js';
import type { AIPredictionEngine } from './ai.types.js';
import { randomizeBallDirection } from '../game/engines/pong/pong.engine.js';
import { PREDICTION_CONFIG } from '../constants/ai.constants.js';
import type { aiConfigType } from '../schemas/ai.schema.js';

export default function createAIPredictionEngine(): AIPredictionEngine {
  function calculateTargetPosition(ball: BallType, aiPaddle: Paddle, config: aiConfigType): number {
    const { x, dx, v } = ball;
    const timeToPaddle = calculateTimeToPaddle(aiPaddle.x, x, dx, v);
    const prediction = ballTrajectoryPrediction(ball, aiPaddle, timeToPaddle);
    const distance = Math.abs(aiPaddle.x - ball.x);
    const closeness = 1 - distance / BOARD_DEFAULTS.width;
    const targetY = applyPredictionError(prediction.y, closeness, config);
    return targetY;
  }

  function ballTrajectoryPrediction(
    ball: BallType,
    aiPaddle: Paddle,
    timeAhead: number,
  ): { x: number; y: number } {
    const maxIterations = PREDICTION_CONFIG.MAX_ITERATIONS;
    const precision = PREDICTION_CONFIG.PRECISION;

    let predictedY = ball.y;
    let predictedX = ball.x;
    let remainingTime = timeAhead;
    let currentDy = ball.dy;
    let currentDx = ball.dx;
    let iterations = 0;

    while (remainingTime > precision && iterations < maxIterations) {
      iterations++;

      const timeToWall = calculateTimeToWall(predictedY, currentDy, ball.v);
      let timeToAIPaddle = Infinity;

      timeToAIPaddle = calculateTimeToPaddle(aiPaddle.x, predictedX, currentDx, ball.v);

      const nextCollision = Math.min(timeToAIPaddle, timeToWall);

      if (nextCollision >= remainingTime) {
        predictedY += currentDy * ball.v * remainingTime;
        predictedX += currentDx * ball.v * remainingTime;
        break;
      } else {
        predictedY += currentDy * ball.v * nextCollision;
        predictedX += currentDx * ball.v * nextCollision;
        remainingTime -= nextCollision;

        if (Math.abs(nextCollision - timeToAIPaddle) < precision) {
          currentDx = -currentDx;
        } else {
          currentDy = randomizeBallDirection(currentDy);
        }
      }
    }

    return { x: predictedX, y: predictedY };
  }

  function calculateTimeToWall(currentY: number, dy: number, velocity: number): number {
    if (dy === 0) return Infinity;

    const boardHeight = BOARD_DEFAULTS.height;
    const ballSize = BALL_DEFAULTS.size;

    if (dy > 0) {
      const distanceToBottom = boardHeight - (currentY + ballSize);
      return distanceToBottom / (dy * velocity);
    } else if (dy < 0) {
      const distanceToTop = currentY;
      return distanceToTop / (-dy * velocity);
    }

    return Infinity;
  }

  function calculateTimeToPaddle(
    paddleX: number,
    ballX: number,
    dx: number,
    velocity: number,
  ): number {
    if (dx === 0) return Infinity;

    const distance = paddleX - ballX;
    const speed = dx * velocity;
    return Math.abs(distance / speed);
  }

  function applyPredictionError(preciseY: number, closeness: number, config: aiConfigType): number {
    const reactionQuality = closeness * config.predictionAccuracy;
    const errorMultiplier = 1 - reactionQuality;
    const maxError = config.predictionError;
    const randomFactor = (Math.random() - 0.5) * 2;
    const biasedRandom =
      Math.sign(randomFactor) * Math.pow(Math.abs(randomFactor), config.errorBias);
    const error = biasedRandom * maxError * errorMultiplier;
    let targetY = preciseY + error;
    if (Math.random() > config.focusLevel) {
      const hesitationError = (Math.random() - 0.5) * config.hesitationRange;
      targetY += hesitationError;
    }
    targetY = Math.max(
      BALL_DEFAULTS.size,
      Math.min(BOARD_DEFAULTS.height - BALL_DEFAULTS.size, targetY),
    );
    return targetY;
  }

  return {
    calculateTargetPosition,
    ballTrajectoryPrediction,
    calculateTimeToPaddle,
  };
}
