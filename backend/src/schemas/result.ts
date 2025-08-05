import { z } from 'zod/v4';
import { gamePlayedBase, gamePlayedQueryBase } from './gamePlayed';

//define the possible statie
const resultStatusBase = z.enum([
  'finished',
  'cancled',
  'cancled_server_error',
]);
const resultStatusSchema = resultStatusBase.meta({ $id: 'resultStatus' });

//define basic object for input
export const resultBase = z.object({
  id: z.number().int().optional(),
  gameId: z.uuid(),
  scorePlayer1: z.number().optional(),
  scorePlayer2: z.number().optional(),
  winnerId: z.number().nullable(),
  loserId: z.number().nullable(),
  player1Username: z.string().nullable(),
  player2Username: z.string().nullable(),
  status: resultStatusBase,
  startedAt: z.preprocess(
    (arg) =>
      typeof arg === 'string' || arg instanceof Date
        ? new Date(arg)
        : undefined,
    z.date(),
  ),
  finishedAt: z.preprocess(
    (arg) =>
      typeof arg === 'string' || arg instanceof Date
        ? new Date(arg)
        : undefined,
    z.date(),
  ),
});

//define schema for response
const resultResponseBase = z.object({
  id: z.number(),
  gameId: z.uuid(),
  status: resultStatusBase,
  startedAt: z.string(),
  finishedAt: z.string(),
  gamePlayed: z.array(gamePlayedBase),
});
const resultResponseSchema = resultResponseBase.meta({ $id: 'resultResponse' });

const resultResponseArrayBase = z.array(resultResponseBase);
const resultResponseArraySchema = resultResponseArrayBase.meta({
  $id: 'resultResponseArray',
});

//define schema for GET
const resultIdBase = z.object({
  id: z.number(),
});
const resultIdSchema = resultIdBase.meta({ $id: 'resultId' });

const resultQueryBase = resultResponseBase
  .extend({
    id: z.coerce.number().optional(),
    gamePlayed: z.array(gamePlayedQueryBase).optional(),
  })
  .partial();
const resultQuerySchema = resultQueryBase.meta({ $id: 'resultQuery' });

//define schema for POST
const resultCreateSchema = resultBase.meta({ $id: 'resultCreate' });

//export schemas
export const resultSchemas = [
  resultStatusSchema,
  resultCreateSchema,
  resultQuerySchema,
  resultIdSchema,
  resultResponseSchema,
  resultResponseArraySchema,
];

export type result = z.infer<typeof resultBase>;
export type resultQueryInput = z.infer<typeof resultQuerySchema>;
export type resultCreateInput = z.infer<typeof resultCreateSchema>;
export type resultResponseType = z.infer<typeof resultResponseSchema>;
export type resultResponseArrayType = z.infer<typeof resultResponseArraySchema>;
