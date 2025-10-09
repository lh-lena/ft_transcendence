import { z } from 'zod/v4';
import { sharedGamePlayedBase, sharedGamePlayedQueryBase } from './shared';
import { dtString } from './basics';

//define the possible statie
const resultStatusBase = z.enum(['finished', 'cancelled', 'cancelled_server_error']);

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
  resultId: z.number(),
  gameId: z.uuid(),
  status: resultStatusBase,
  startedAt: dtString,
  finishedAt: dtString,
  gamePlayed: z.array(sharedGamePlayedBase).optional(),
});

//define schema for GET
const resultId = resultBase.pick({ resultId: true }).meta({ $id: 'resultId' });

const resultQueryBase = z
  .object({
    resultId: z.coerce.number().optional(),
    gameId: z.uuid().optional(),
    startedAt: dtString.optional(),
    finishedAt: dtString.optional(),
    gamePlayed: z.object({ some: sharedGamePlayedQueryBase }).optional(),
  })
  .describe('Query for results with optional filters');
const resultQuery = resultQueryBase.meta({ $id: 'resultQuery' });

//leaderboard
const leaderboardBase = z.object({
  userId: z.uuid(),
  wins: z.number(),
});
const leaderboard = z
  .array(leaderboardBase)
  .meta({ $id: 'leaderboard' })
  .describe('Leaderboard with user id, username and number of wins');

//schemas for response
const resultResponseBase = z.object({
  resultId: z.number(),
  gameId: z.uuid(),
  startedAt: dtString,
  finishedAt: dtString,
  status: resultStatusBase,
  winnerId: z.uuid().optional(),
  loserId: z.uuid().optional(),
  winnerScore: z.number().optional(),
  loserScore: z.number().optional(),
});

export const resultResponse = resultResponseBase.meta({ $id: 'resultResponse' });
export const resultResponseArray = z.array(resultResponseBase).meta({ $id: 'resultResponseArray' });

export const resultWinsLoses = z
  .object({
    userId: z.uuid(),
    wins: z.number(),
    loses: z.number(),
  })
  .meta({ $id: 'resultWinsLoses' });

//export schemas
export const resultSchemas = [
  //  resultStatusSchema,
  resultCreate,
  resultQuery,
  resultId,
  resultResponse,
  resultResponseArray,
  resultWinsLoses,
  leaderboard,
];
//
export type resultType = z.infer<typeof resultBase>;
export type resultIdType = z.infer<typeof resultId>;
export type resultCreateType = z.infer<typeof resultCreate>;
export type resultQueryType = z.infer<typeof resultQuery>;
export type resultResponseType = z.infer<typeof resultResponse>;
export type resultResponseArrayType = z.infer<typeof resultResponseArray>;
export type leaderboardType = z.infer<typeof leaderboard>;
export type resultWinsLosesType = z.infer<typeof resultWinsLoses>;
