import { z } from 'zod/v4';

import * as basics from './basics';

const gameModeBase = z.enum([ 'pvp_remote', 'pvp_local', 'pvp_ai' ]);
const gameModeSchema = gameModeBase.meta({ $id: 'gameMode' });

const matchStatusBase = z.enum([ 'waiting', 'ready', 'playing', 'finished' ]);
const matchStatusSchema = matchStatusBase.meta({ $id: 'matchStatus' });

const matchVisibilityBase = z.enum([ 'public', 'private' ]);
const matchVisibilitySchema = matchVisibilityBase.meta({ $id: 'matchVisibility' });

const matchRequestBase = z.object({
  userId: z.number(),
  mode: gameModeBase,
  visibility: matchVisibilityBase,
  matchId: z.string().optional(),
  ready: basics.booleanString,
  time: z.number().optional(),
});
const matchRequestSchema = matchRequestBase.meta( { $id: 'matchRequest' } );
const matchRequestArray = z.array( matchRequestBase ).meta( { $id: 'matchRequestArray' } );

const matchBase = z.object({
  matchId: z.string(),
  players: z.array(matchRequestBase),
  mode: gameModeBase,
  status: matchStatusBase,
  visibility: matchVisibilityBase,
  createAt: z.string(),
});
const matchSchema = matchBase.meta( { $id: 'match' } );
const matchArraySchema = z.array(matchBase).meta( { $id: 'matchArray' } );

//crud types

const matchQuerySchema = z.object({
  status: matchStatusBase.optional(),
}).meta( { $id: 'matchQuery' } );

const matchResponseSchemaArray = z.array(
  matchBase
).meta( { $id: "matchResponseArray" } );

const matchIdSchema = z.object({
  id: z.string().uuid(),
}).meta( { $id: "matchId" } );

const matchResponseSchema = matchBase.meta( { $id: "matchResponse" } );

const matchCreateSchema = matchRequestBase.meta( { $id: "matchCreate" } );

const matchUpdateSchema = z.object({
  ready: basics.booleanString.optional(),
}).meta( { $id: "matchUpdate" } );

const matchDeleteSchema = z.object({
  message: z.string(),
}).meta( { $id: "matchDelete" } );

export type matchCreateInput = z.infer< typeof matchCreateSchema >;
export type matchUpdateInput = z.infer< typeof matchUpdateSchema >;
export type matchIdInput = z.infer< typeof matchIdSchema >;
export type matchQueryInput = z.infer< typeof matchQuerySchema >;
export type matchResponseType = z.infer< typeof matchResponseSchema >;
export type matchResponseArrayType = z.infer< typeof matchResponseSchemaArray >;

export type matchRequest = z.infer<typeof matchRequestSchema>;
export type match = z.infer<typeof matchSchema>;

export const matchSchemas = [
  gameModeSchema,
  matchStatusSchema,
  matchVisibilitySchema,
  matchRequestSchema,
  matchRequestArray,
  matchSchema,
  matchArraySchema,
  matchCreateSchema,
  matchUpdateSchema,
  matchDeleteSchema,
  matchResponseSchema,
  matchResponseSchemaArray,
  matchIdSchema,
  matchQuerySchema,
]

