import type { aiState } from '../schemas/ai.schema.js';
import type { Paddle } from '../schemas/game.schema.js';
import { BALL_DEFAULTS, Direction } from '../constants/game.constants.js';
import type { AIMovementController } from './ai.types.js';

export default function createAIMovementController(): AIMovementController {
  function updateDirection(aiState: aiState, aiPaddle: Paddle): Direction {
    const targetDirection = defineTargetDirection(aiState, aiPaddle);
    aiState.currentDirection = targetDirection;
    return targetDirection;
  }

  function defineTargetDirection(aiState: aiState, aiPaddle: Paddle): Direction {
    const targetCenter = aiState.targetYPosition + BALL_DEFAULTS.size / 2;
    const currentCenter = aiPaddle.y + aiPaddle.height / 2;

    const threshold = getDeadZone(aiPaddle.height, aiState.config.threshold);
    if (Math.abs(targetCenter - currentCenter) < threshold) {
      return Direction.STOP;
    }
    const correctDirection = targetCenter > currentCenter ? Direction.DOWN : Direction.UP;
    return correctDirection;
  }

  function getDeadZone(height: number, threshold: number): number {
    return height * threshold;
  }

  return {
    updateDirection,
  };
}
