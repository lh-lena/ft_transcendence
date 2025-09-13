import type { FastifyInstance } from 'fastify';
import type { aiState } from '../schemas/ai.schema.js';
import type { Paddle } from '../schemas/game.schema.js';
import { Direction } from '../constants/game.constants.js';
import type { AIMovementController } from './ai.types.js';
import { AI_THRESHOLD } from '../constants/ai.constants.js';

export default function createAIMovementController(_app: FastifyInstance): AIMovementController {
  function updateMovement(aiState: aiState, aiPaddle: Paddle): Direction {
    const targetPosition = aiState.targetYPosition;
    const targetDirection = defineTargetDirection(targetPosition, aiPaddle);
    aiState.currentDirection = targetDirection;
    return targetDirection;
  }

  function defineTargetDirection(targetPosition: number, aiPaddle: Paddle): Direction {
    const currentCenter = aiPaddle.y + aiPaddle.height / 2;
    const threshold = AI_THRESHOLD;
    if (Math.abs(targetPosition - currentCenter) < threshold) {
      return Direction.STOP;
    }
    return targetPosition > currentCenter ? Direction.DOWN : Direction.UP;
  }

  return {
    updateMovement,
  };
}
