import { z } from 'zod/v4';

import { userShallow, userQueryBase } from './user';

export const gamePlayedShallow = z.object({
  id: z.number(),
  userId: z.number(),
  score: z.number(),
  isWinner: z.boolean(),
});

export const gamePlayedBase = z.object({
  id: z.number(),
  userId: z.number(),
  score: z.number(),
  isWinner: z.boolean(),
  get user() {
    return userShallow;
  },
});

const gamePlayedSchema = gamePlayedBase.meta({ $id: 'gamePlayed' });

export const gamePlayedArrayBase = z.array(gamePlayedBase);
const gamePlayedArraySchema = gamePlayedArrayBase.meta({
  $id: 'gamePlayedArray',
});

export const gamePlayedQueryBase = z.lazy(() =>
  z
    .object({
      id: z.coerce.number().optional(),
      userId: z.coerce.number().optional(),
      user: userQueryBase.optional(),
      isWinner: z.coerce.boolean().optional(),
    })
    .partial(),
);
const gamePlayedQuerySchema = gamePlayedQueryBase.meta({
  $id: 'gamePlayedQuery',
});

export const gamePlayedSchemas = [
  gamePlayedSchema,
  gamePlayedArraySchema,
  gamePlayedQuerySchema,
];

export type gamePlayedType = z.infer<typeof gamePlayedBase>;
