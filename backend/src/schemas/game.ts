import { z } from 'zod/v4';
import { userBaseArray } from './user';

export const gameModeBase = z.enum([ 'pvp_remote', 'pvp_ai', 'tournament' ]);
const gameModeSchema = gameModeBase.meta({ $id: 'gameMode' });

const gameStatusBase = z.enum([ 'waiting', 'ready', 'playing', 'finished' ]);
const gameStatusSchema = gameStatusBase.meta({ $id: 'gameStatus' });

const aiDifficultyBase = z.enum([ 'easy', 'medium', 'hard' ]);
const aiDifficultySchema = aiDifficultyBase.meta({ $id: 'aiDifficulty' });

const gameVisibilityBase = z.enum([ 'public', 'private' ]);
const gameVisibilitySchema = gameVisibilityBase.meta({ $id: 'gameVisibility' });

const gameCreateBase = z.object({
  userId: z.number(),
  mode: gameModeBase,
  aiDifficulty: aiDifficultyBase.optional(),
  gameId: z.string().optional(),
  visibility: gameVisibilityBase,
});

const gameCreateSchema = gameCreateBase.meta( { $id: 'gameCreate' } );

const gameBase = z.object({
  gameId: z.string(),
  players: userBaseArray,
  mode: gameModeBase,
  status: gameStatusBase,
  visibility: gameVisibilityBase,
  createAt: z.string().optional(),
});

const gameSchema = gameBase.meta( { $id: 'game' } );
const gameArraySchema = z.array(gameBase).meta( { $id: 'gameArray' } );

//crud types

const gameQuerySchema = gameBase.partial().meta( { $id: 'gameQuery' } );

const gameResponseSchemaArray = z.array(
  gameBase
).meta( { $id: "gameResponseArray" } );

export const gameIdBase = z.object({
  id: z.string().uuid(),
});

export const gameIdSchema = gameIdBase.meta(  { $id: "gameId" } );

const gameResponseSchema = gameBase.meta( { $id: "gameResponse" } );

const gameUpdateSchema = z.object({
  status: gameStatusBase,
}).meta( { $id: "gameUpdate" } );

const gameDeleteSchema = z.object({
  message: z.string(),
}).meta( { $id: "gameDelete" } );

export type gameCreateInput = z.infer< typeof gameCreateSchema >;
export type gameUpdateInput = z.infer< typeof gameUpdateSchema >;
export type userUpdateInput = z.infer< typeof userUpdateSchema >;
export type gameIdInput = z.infer< typeof gameIdSchema >;
export type gameQueryInput = z.infer< typeof gameQuerySchema >;
export type gameResponseType = z.infer< typeof gameResponseSchema >;
export type gameResponseArrayType = z.infer< typeof gameResponseSchemaArray >;

export type gameCreate = z.infer<typeof gameCreateSchema>;
export type game = z.infer<typeof gameSchema>;

export const gameSchemas = [
  gameModeSchema,
  gameStatusSchema,
  gameCreateSchema,
  gameSchema,
  gameArraySchema,
  gameUpdateSchema,
  gameDeleteSchema,
  gameResponseSchema,
  gameResponseSchemaArray,
  gameIdSchema,
  gameQuerySchema,
]

