import { z } from 'zod/v4';

const gameModeBase = z.enum([ 'pvp_remote', 'pvp_local', 'pvp_ai' ]);
const gameModeSchema = gameModeBase.meta({ $id: 'gameMode' });

const matchStatusBase = z.enum([ 'waiting', 'ready', 'playing', 'finished' ]);
const matchStatusSchema = matchStatusBase.meta({ $id: 'matchStatus' });

const aiDifficultyBase = z.enum([ 'easy', 'medium', 'hard' ]);
const aiDifficultySchema = aiDifficultyBase.meta({ $id: 'aiDifficulty' });

const matchVisibilityBase = z.enum([ 'public', 'private' ]);
const matchVisibilitySchema = matchVisibilityBase.meta({ $id: 'matchVisibility' });

const matchCreateBase = z.object({
  userId: z.number(),
  mode: gameModeBase,
  aiDifficulty: aiDifficultyBase.optional(),
  matchId: z.string().optional(),
  visibility: matchVisibilityBase,
});

const matchCreateSchema = matchCreateBase.meta( { $id: 'matchCreate' } );

const matchBase = z.object({
  matchId: z.string(),
  players: z.array(matchCreateBase),
  mode: gameModeBase,
  status: matchStatusBase,
  visibility: matchVisibilityBase,
  createAt: z.string().optional(),
});

const matchSchema = matchBase.meta( { $id: 'match' } );
const matchArraySchema = z.array(matchBase).meta( { $id: 'matchArray' } );

//crud types

const matchQuerySchema = matchBase.partial().meta( { $id: 'matchQuery' } );

const matchResponseSchemaArray = z.array(
  matchBase
).meta( { $id: "matchResponseArray" } );

export const matchIdBase = z.object({
  id: z.string().uuid(),
});

export const matchIdSchema = matchIdBase.meta(  { $id: "matchId" } );

const matchResponseSchema = matchBase.meta( { $id: "matchResponse" } );

const matchUpdateSchema = z.object({
  status: matchStatusBase,
}).meta( { $id: "matchUpdate" } );

const matchDeleteSchema = z.object({
  message: z.string(),
}).meta( { $id: "matchDelete" } );

export type matchCreateInput = z.infer< typeof matchCreateSchema >;
export type matchUpdateInput = z.infer< typeof matchUpdateSchema >;
export type userUpdateInput = z.infer< typeof userUpdateSchema >;
export type matchIdInput = z.infer< typeof matchIdSchema >;
export type matchQueryInput = z.infer< typeof matchQuerySchema >;
export type matchResponseType = z.infer< typeof matchResponseSchema >;
export type matchResponseArrayType = z.infer< typeof matchResponseSchemaArray >;

export type matchCreate = z.infer<typeof matchCreateSchema>;
export type match = z.infer<typeof matchSchema>;

export const matchSchemas = [
  gameModeSchema,
  matchStatusSchema,
  matchCreateSchema,
  matchSchema,
  matchArraySchema,
  matchUpdateSchema,
  matchDeleteSchema,
  matchResponseSchema,
  matchResponseSchemaArray,
  matchIdSchema,
  matchQuerySchema,
]

