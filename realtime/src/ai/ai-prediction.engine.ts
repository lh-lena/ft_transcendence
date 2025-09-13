import type { FastifyInstance } from 'fastify';
import type { Paddle, BallType } from '../schemas/game.schema.js';
import type { aiConfigType } from '../schemas/ai.schema.js';
import { BALL_DEFAULTS, BOARD_DEFAULTS } from '../constants/game.constants.js';
import type { AIPredictionEngine } from './ai.types.js';

export default function createAIPredictionEngine(_app: FastifyInstance): AIPredictionEngine {
  function calculateTargetPosition(ball: BallType, aiPaddle: Paddle, config: aiConfigType): number {
    if (!isBallMovingTowardAI(ball, aiPaddle)) {
      return aiPaddle.y;
    }
    const timeToPaddle = calculateTimeToPaddle(aiPaddle.x, ball.x, ball.dx, ball.v);
    const predictionTime = Math.min(timeToPaddle, config.predictionTime);
    const predictedY = ballTrajectoryPrediction(ball, predictionTime);
    return predictedY;
  }

  function ballTrajectoryPrediction(ball: BallType, timeAhead: number): number {
    const timeToWall = calculateTimeToWall(ball.y, ball.dy, ball.v);
    if (timeToWall >= timeAhead) {
      return linearBallPrediction(ball, timeAhead);
    }

    let predictedY = ball.y;
    let remainingTime = timeAhead;
    let currentDy = ball.dy;

    while (remainingTime > 0) {
      const timeToWall = calculateTimeToWall(predictedY, currentDy, ball.v);

      if (timeToWall >= remainingTime) {
        predictedY += currentDy * ball.v * remainingTime;
        break;
      } else {
        predictedY += currentDy * ball.v * timeToWall;
        currentDy *= -1;
        remainingTime -= timeToWall;
      }
    }

    return predictedY;
  }

  function isBallMovingTowardAI(ball: BallType, aiPaddle: Paddle): boolean {
    return (ball.dx > 0 && aiPaddle.x > ball.x) || (ball.dx < 0 && aiPaddle.x < ball.x);
  }

  function linearBallPrediction(ball: BallType, timeAhead: number): number {
    const { y, dy, v } = ball;
    return y + dy * v * timeAhead;
  }

  function calculateTimeToWall(currentY: number, dy: number, velocity: number): number {
    if (dy === 0) return Infinity;

    const boardHeight = BOARD_DEFAULTS.height;
    const ballSize = BALL_DEFAULTS.size;

    if (dy > 0) {
      const distanceToBottom = boardHeight - (currentY + ballSize);
      return distanceToBottom / (dy * velocity);
    } else {
      const distanceToTop = currentY;
      return distanceToTop / (-dy * velocity);
    }
  }

  function calculateTimeToPaddle(
    paddleX: number,
    ballX: number,
    dx: number,
    velocity: number,
  ): number {
    const distance = Math.abs(paddleX - (ballX + BALL_DEFAULTS.size));
    return distance / (Math.abs(dx) * velocity);
  }

  return {
    calculateTargetPosition,
  };
}
