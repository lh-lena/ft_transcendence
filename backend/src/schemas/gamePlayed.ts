import { z } from 'zod/v4';
import { userBase } from './user';
import { resultBase } from './result';

export const gamePlayedBase = z.object({
  id: z.number(),
  userId: z.number(),
  resultId: z.number(),
  score: z.number(),
  isWinner: z.boolean(),
  get user() {
    return userBase;
  },
  get result() {
    return resultBase;
  },
});
const gamePlayedSchema = gamePlayedBase.meta({ $id: 'gamePlayed' });

export const gamePlayedArrayBase = z.array(gamePlayedBase);
const gamePlayedArraySchema = gamePlayedArrayBase.meta({
  $id: 'gamePlayedArray',
});

export const gamePlayedQueryBase = z.object({
  id: z.coerce.number().optional(),
  userId: z.coerce.number().optional(),
  isWinner: z.coerce.boolean().optional(),
  score: z.coerce.number().optional(),
  gameId: z.coerce.number().optional(),
});
const gamePlayedQuerySchema = gamePlayedQueryBase.meta({
  $id: 'gamePlayedQuery',
});

export const gamePlayedResponseBase = z.object({
  id: z.number().optional(),
  userId: z.number().optional(),
  resultId: z.number().optional(),
  score: z.number().optional(),
  isWinner: z.boolean().optional(),
});
const gamePlayedResponseSchema = gamePlayedResponseBase.meta({
  $id: 'gamePlayedResponse',
});

const gamePlayedResponseArraySchema = z
  .array(gamePlayedResponseBase)
  .meta({ $id: 'gamePlayedResponseBaseArray' });
export const gamePlayedSchemas = [
  gamePlayedSchema,
  gamePlayedArraySchema,
  gamePlayedQuerySchema,
  gamePlayedResponseSchema,
  gamePlayedResponseArraySchema,
];

export type gamePlayedType = z.infer<typeof gamePlayedBase>;
