import { z } from 'zod/v4';
import { Direction } from '../constants/game.constants';
import { AIDifficulty } from '../constants/ai.constants';
import { GameIdSchema } from '../schemas/game.schema';

/**
 * @description AI configuration schema
 * @property deadZone - Size of dead zone as ratio of paddle height (0-1)
 * @property predictionError - Maximum error in pixels
 * @property predictionAccuracy - Base accuracy level (0-1)
 * @property errorBias - How centered errors are (0.5-1.5)
 * @property focusLevel - How often AI stays focused (0-1)
 * @property hesitationRange - Size of hesitation error (pixels)
 */
export const aiConfigSchema = z.object({
  deadZone: z.number(),
  predictionError: z.number(),
  predictionAccuracy: z.number(),
  errorBias: z.number(),
  focusLevel: z.number(),
  hesitationRange: z.number(),
});

export const aiStateSchema = z.object({
  gameId: GameIdSchema,
  targetDirection: z.enum(Direction),
  currentDirection: z.enum(Direction),
  targetYPosition: z.number(),
  timeAccumulator: z.number(),
  difficulty: z.enum(AIDifficulty),
  config: aiConfigSchema,
  lastProcessedSequence: z.number().min(0),
});

export type aiState = z.infer<typeof aiStateSchema>;
export type aiConfigType = z.infer<typeof aiConfigSchema>;
