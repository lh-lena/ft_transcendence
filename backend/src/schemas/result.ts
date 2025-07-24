import { z } from 'zod/v4';

import { userBase, userQueryBase } from './user';

const resultStatusBase = z.enum([ 'finished', 'cancelled', 'cancelled_server_error' ])
const resultStatusSchema = resultStatusBase.meta({ $id: 'resultStatus' });

export const resultBase = z.object({
  id:              z.number().int().optional(),
  gameId:          z.string().uuid(),
  scorePlayer1:    z.number().optional(),
  scorePlayer2:    z.number().optional(),
  winnerId:        z.number().nullable(),
  loserId:         z.number().nullable(),
  player1Username: z.string().nullable(),
  player2Username: z.string().nullable(),
  status:          resultStatusBase,
  startedAt:       z.string(),
  finishedAt:      z.string(),
});

const resultSchema = resultBase.meta( { $id: 'result' } );
const resultSchemaArray = z.array( resultBase ).meta({ $id: 'resultArray' });

const resultIdBase = z.object({
  id: z.number(),
})
const resultIdSchema = resultIdBase.meta({ $id: 'resultId' });

const resultCreateSchema = resultBase.meta({ $id: 'resultCreate' })

const gamePlayedBase = z.object({
  id:              z.number(),
  userId:          z.number(),
  user:            userBase,
  score:           z.number(),
  isWinner:        z.boolean(),
  isAi:            z.boolean(),
})
const gamePlayedBaseArray = z.array(gamePlayedBase)

const resultResponseBase = z.object({
  id:              z.number(),
  gameId:          z.string().uuid(),
  status:          resultStatusBase,
  startedAt:       z.string(),
  finishedAt:      z.string(),
  gamePlayed:      z.any(),
});

const resultResponseSchema = resultResponseBase.meta( { $id: "resultResponse" } )
const resultResponseSchemaArray = z.array(resultResponseBase).meta( { $id: "resultResponseArray" } )

const gamePlayedQueryBase = gamePlayedBase.extend({
  id: z.coerce.number().optional(),
  userId: z.coerce.number().optional(),
  user: userQueryBase.optional(),
  isWinner: z.coerce.boolean().optional(),
  isAi: z.coerce.boolean().optional(),
}).partial();
const gamePlayedQuerySchema = gamePlayedQueryBase.meta({ $id: 'gamePlayedQuery' });

const resultQueryBase = resultResponseBase.extend({
  id: z.coerce.number().optional(),
  gamePlayed: z.array(gamePlayedQueryBase).optional(),
}).partial();
const resultQuerySchema = resultQueryBase.meta({ $id: 'resultQuery' });


export const resultSchemas = [
  resultStatusSchema,
  resultSchema,
  resultSchemaArray,
  resultCreateSchema,
  resultQuerySchema,
  resultIdSchema,
  resultResponseSchema,
  resultResponseSchemaArray,
]
