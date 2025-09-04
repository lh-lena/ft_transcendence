import { z } from 'zod/v4';

export const sharedGamePlayedBase = z.object({
  id: z.number(),
  userId: z.number(),
  resultId: z.number(),
  score: z.number(),
  isWinner: z.boolean(),
});

export const sharedGamePlayedQueryBase = z.object({
  id: z.coerce.number().optional(),
  userId: z.coerce.number().optional(),
  isWinner: z.coerce.boolean().optional(),
  score: z.coerce.number().optional(),
  gameId: z.coerce.number().optional(),
});
