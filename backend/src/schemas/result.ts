import { z } from 'zod/v4';
import { sharedGamePlayedBase, sharedGamePlayedQueryBase } from './shared';
import { dtString } from './basics';

//define the possible statie
const resultStatusBase = z.enum([
  'finished',
  'cancled',
  'cancled_server_error',
]);
const resultStatusSchema = resultStatusBase.meta({ $id: 'resultStatus' });

//define basic object for input
export const resultInputBase = z.object({
  id: z.number().int().optional(),
  gameId: z.uuid(),
  scorePlayer1: z.number(),
  scorePlayer2: z.number(),
  winnerId: z.number(),
  loserId: z.number(),
  player1Username: z.string(),
  player2Username: z.string(),
  status: resultStatusBase,
  startedAt: dtString,
  finishedAt: dtString,
});

//define schema for response
export const resultBase = z.object({
  id: z.number(),
  gameId: z.uuid(),
  status: resultStatusBase,
  startedAt: dtString,
  finishedAt: dtString,
  gamePlayed: z.array(sharedGamePlayedBase).optional(),
});

const resultResponseBase = resultBase;
export const resultResponseSchema = resultResponseBase.meta({
  $id: 'resultResponse',
});

const resultResponseArrayBase = z.array(resultResponseBase);
export const resultResponseArraySchema = resultResponseArrayBase.meta({
  $id: 'resultResponseArray',
});

//define schema for GET
const resultIdBase = z.object({
  id: z.number(),
});
const resultIdSchema = resultIdBase.meta({ $id: 'resultId' });

const resultQueryBase = z.object({
  id: z.coerce.number().optional(),
  gameId: z.uuid().optional(),
  startedAt: dtString.optional(),
  finishedAt: dtString.optional(),
  gamePlayed: z.object({ some: sharedGamePlayedQueryBase }).optional(),
});
const resultQuerySchema = resultQueryBase.meta({ $id: 'resultQuery' });

//define schema for POST
export const resultCreateSchema = resultInputBase.meta({ $id: 'resultCreate' });

//export schemas
export const resultSchemas = [
  resultStatusSchema,
  resultCreateSchema,
  resultQuerySchema,
  resultIdSchema,
  resultResponseSchema,
  resultResponseArraySchema,
];

export type resultType = z.infer<typeof resultBase>;
export type resultInputType = z.infer<typeof resultInputBase>;
export type resultQueryInput = z.infer<typeof resultQuerySchema>;
export type resultIdInput = z.infer<typeof resultIdSchema>;
export type resultCreateInput = z.infer<typeof resultCreateSchema>;
export type resultResponseType = z.infer<typeof resultResponseSchema>;
export type resultResponseArrayType = z.infer<typeof resultResponseArraySchema>;
