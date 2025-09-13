import { z } from 'zod/v4';
import { Direction } from '../constants/game.constants';
import { AIDifficulty } from '../constants/ai.constants';
import { GameIdSchema } from '../schemas/game.schema';

export const aiConfigSchema = z.object({
  errorRate: z.number(),
  predictionTime: z.number(),
  responseDelay: z.number(),
});

export const aiStateSchema = z.object({
  gameId: GameIdSchema,
  targetDirection: z.enum(Direction),
  currentDirection: z.enum(Direction),
  targetYPosition: z.number(),
  timeAccumulator: z.number(),
  difficulty: z.enum(AIDifficulty),
  config: aiConfigSchema,
  metrics: z.object({
    hits: z.number(),
    misses: z.number(),
    recentMistakes: z.array(z.number()),
  }),
});

export type aiState = z.infer<typeof aiStateSchema>;
export type aiConfigType = z.infer<typeof aiConfigSchema>;
