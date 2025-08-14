import { z } from 'zod/v4';
import { sharedGamePlayedBase, sharedGamePlayedQueryBase } from './shared';
import { dtString } from './basics';

//define the possible statie
const resultStatusBase = z.enum([
  'finished',
  'cancled',
  'cancled_server_error',
]);

//define basic object for input
const resultInputBase = z.object({
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
const resultCreate = resultInputBase.meta({ $id: 'resultCreate' });

//result base
export const resultBase = z.object({
  id: z.number(),
  gameId: z.uuid(),
  status: resultStatusBase,
  startedAt: dtString,
  finishedAt: dtString,
  gamePlayed: z.array(sharedGamePlayedBase).optional(),
});

//define schema for GET
const resultId = z
  .object({
    id: z.number(),
  })
  .meta({ $id: 'resultId' });

const resultQueryBase = z.object({
  id: z.coerce.number().optional(),
  gameId: z.uuid().optional(),
  startedAt: dtString.optional(),
  finishedAt: dtString.optional(),
  gamePlayed: z.object({ some: sharedGamePlayedQueryBase }).optional(),
});
const resultQuery = resultQueryBase.meta({ $id: 'resultQuery' });

//schemas for response
const resultResponse = resultBase.meta({ $id: 'resultResponse' });
const resultResponseArray = z
  .array(resultBase)
  .meta({ $id: 'resultResponseArray' });
//export schemas
export const resultSchemas = [
  //  resultStatusSchema,
  resultCreate,
  resultQuery,
  resultId,
  resultResponse,
  resultResponseArray,
];
//
export type resultType = z.infer<typeof resultBase>;
export type resultCreateInput = z.infer<typeof resultCreate>;
export type resultQueryInput = z.infer<typeof resultQuery>;
