import { z } from 'zod/v4';

import { userBase, userQueryBase } from './user';

export const gamePlayedBase = z.object({
  id: z.number(),
  userId: z.number(),
  user: userBase,
  score: z.number(),
  isWinner: z.boolean(),
  isAi: z.boolean(),
});
const gamePlayedSchema = gamePlayedBase.meta({ $id: 'gamePlayed' });

export const gamePlayedArrayBase = z.array(gamePlayedBase);
const gamePlayedArraySchema = gamePlayedArrayBase.meta({
  $id: 'gamePlayedArray',
});

export const gamePlayedQueryBase = gamePlayedBase
  .extend({
    id: z.coerce.number().optional(),
    userId: z.coerce.number().optional(),
    user: userQueryBase.optional(),
    isWinner: z.coerce.boolean().optional(),
    isAi: z.coerce.boolean().optional(),
  })
  .partial();
const gamePlayedQuerySchema = gamePlayedQueryBase.meta({
  $id: 'gamePlayedQuery',
});

export const gamePlayedSchemas = [
  gamePlayedSchema,
  gamePlayedArraySchema,
  gamePlayedQuerySchema,
];
