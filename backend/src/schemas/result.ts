import { z } from 'zod/v4';
import { sharedGamePlayedBase, sharedGamePlayedQueryBase } from './shared';
import { dtString } from './basics';

//define the possible statie
const resultStatusBase = z.enum(['finished', 'cancled', 'cancled_server_error']);

//define basic object for input
const resultTypeBase = z.object({
  gameId: z.uuid(),
  scorePlayer1: z.number(),
  scorePlayer2: z.number(),
  winnerId: z.uuid(),
  loserId: z.uuid(),
  player1Username: z.string(),
  player2Username: z.string(),
  status: resultStatusBase,
  startedAt: dtString,
  finishedAt: dtString,
});
const resultCreate = resultTypeBase
  .meta({ $id: 'resultCreate' })
  .describe('Create a new game result');

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
const resultId = resultBase.pick({ id: true }).meta({ $id: 'resultId' });

const resultQueryBase = z
  .object({
    id: z.coerce.number().optional(),
    gameId: z.uuid().optional(),
    startedAt: dtString.optional(),
    finishedAt: dtString.optional(),
    gamePlayed: z.object({ some: sharedGamePlayedQueryBase }).optional(),
  })
  .describe('Query for results with optional filters');
const resultQuery = resultQueryBase.meta({ $id: 'resultQuery' });

//leaderboard
const leaderboardBase = z.object({
  id: z.number(),
  username: z.string(),
  wins: z.number(),
});
const leaderboard = z
  .array(leaderboardBase)
  .meta({ $id: 'leaderboard' })
  .describe('Leaderboard with user id, username and number of wins');

//schemas for response
const resultResponse = resultBase.meta({ $id: 'resultResponse' });
const resultResponseArray = z.array(resultBase).meta({ $id: 'resultResponseArray' });
//export schemas
export const resultSchemas = [
  //  resultStatusSchema,
  resultCreate,
  resultQuery,
  resultId,
  resultResponse,
  resultResponseArray,
  leaderboard,
];
//
export type resultType = z.infer<typeof resultBase>;
export type resultCreateType = z.infer<typeof resultCreate>;
export type resultQueryType = z.infer<typeof resultQuery>;
export type leaderboardType = z.infer<typeof leaderboard>;
