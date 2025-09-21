import type { FastifyInstance } from 'fastify';
import type { Paddle, BallType } from '../schemas/game.schema.js';
import type { aiConfigType, aiState } from '../schemas/ai.schema.js';
import { BALL_DEFAULTS, BOARD_DEFAULTS, PADDLE_DEFAULTS } from '../constants/game.constants.js';
import type { AIPredictionEngine } from './ai.types.js';

export default function createAIPredictionEngine(app: FastifyInstance): AIPredictionEngine {
  const { log } = app;
  const centerPosition = BOARD_DEFAULTS.height / 2;

  function calculateTargetPosition(ball: BallType, aiPaddle: Paddle, config: aiConfigType): number {
    const movingTowardAI = isBallMovingTowardAI(ball, aiPaddle);
    if (!movingTowardAI) {
      return randomizeCenterPosition(config);
    }
    const { x, dx, v } = ball;
    const timeToPaddle = calculateTimeToPaddle(aiPaddle.x, x, dx, v);
    const predictionTime = Math.min(timeToPaddle, config.predictionTime);
    const prediction = ballTrajectoryPrediction(ball, aiPaddle, predictionTime, config);
    const predictedY = prediction.y;
    const randomError = (Math.random() - 0.5) * config.predictionError;
    prediction.y += randomError;
    logAIState(predictedY, ball, aiPaddle);
    return prediction.y;
  }

  function randomizeCenterPosition(config: aiConfigType): number {
    let range: number;
    range = config.predictionError * 2;

    const position = centerPosition + (Math.random() - 0.5) * range;
    return position;
  }

  function ballTrajectoryPrediction(
    ball: BallType,
    aiPaddle: Paddle,
    timeAhead: number,
    config: aiConfigType,
  ): { x: number; y: number } {
    const maxIterations = 100;
    const precision = config.precision;

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
          currentDy = -currentDy;
        }
      }
    }

    return { x: predictedX, y: predictedY };
  }

  // function ballTrajectoryPrediction(ball: BallType, timeAhead: number): { x: number; y: number } {
  //   const bounceTime = calculateTimeToWall(ball.y, ball.dy, ball.v);
  //   if (bounceTime < timeAhead) {
  //     return simulateBounce(ball, timeAhead);
  //   }

  //   return linearBallPrediction(ball, timeAhead);
  // }

  function simulateBounce(ball: BallType, timeAhead: number): { x: number; y: number } {
    const { y, dy, v } = ball;
    let predictedY = y;
    let predictedDy = dy;
    let remainTime = timeAhead;
    while (remainTime > 0) {
      const timeToWall = calculateTimeToWall(predictedY, predictedDy, v);
      if (timeToWall >= remainTime) {
        predictedY += predictedDy * v * remainTime;
        break;
      } else {
        predictedY += predictedDy * v * timeToWall;
        predictedDy *= -1;
        remainTime -= timeToWall;
      }
    }

    return { x: ball.x, y: predictedY };
  }

  function isBallMovingTowardAI(ball: BallType, aiPaddle: Paddle): boolean {
    return (ball.dx > 0 && aiPaddle.x > ball.x) || (ball.dx < 0 && aiPaddle.x < ball.x);
  }

  function linearBallPrediction(ball: BallType, timeAhead: number): { x: number; y: number } {
    const { dy, v } = ball;
    const x = ball.x + ball.dx * v * timeAhead;
    const y = ball.y + dy * v * timeAhead;
    return { x, y };
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

  function calculateCloseness(ball: BallType, paddle: Paddle): number {
    return (ball.dx < 0 ? ball.x - paddle.x : paddle.x - ball.x) / BOARD_DEFAULTS.width;
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

  function logAIState(predictedBallY: number, ball: BallType, aiPaddle: Paddle): void {
    const timeToPaddle = calculateTimeToPaddle(aiPaddle.x, ball.x, ball.dx, ball.v);

    log.info(`
      ball.x: ${ball.x}
      ball.y: ${ball.y}
      ball.dx: ${ball.dx}
      ball.dy: ${ball.dy}
      ball.v: ${ball.v}
      aiPaddle.x: ${aiPaddle.x}
      aiPaddle.y: ${aiPaddle.y}
      aiPaddle.height: ${aiPaddle.height}
      predictedBallY: ${predictedBallY}
      timeToPaddle: ${timeToPaddle}
      `);
  }

  return {
    calculateTargetPosition,
    ballTrajectoryPrediction,
  };
}
