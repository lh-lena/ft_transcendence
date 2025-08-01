import { z } from 'zod/v4';
import { userBase } from './user';

//define game mode
export const gameModeBase = z.enum([ 'pvp_remote', 'pvp_ai', 'tournament' ]);
const gameModeSchema = gameModeBase.meta({ $id: 'gameMode' });

//define game status
const gameStatusBase = z.enum([ 'waiting', 'ready', 'playing', 'finished' ]);
const gameStatusSchema = gameStatusBase.meta({ $id: 'gameStatus' });

//define ai diff
const aiDifficultyBase = z.enum([ 'easy', 'medium', 'hard' ]);
const aiDifficultySchema = aiDifficultyBase.meta({ $id: 'aiDifficulty' });

//define game visibility for tournaments
const gameVisibilityBase = z.enum([ 'public', 'private' ]);
const gameVisibilitySchema = gameVisibilityBase.meta({ $id: 'gameVisibility' });

//game object
const gameBase = z.object({
  gameId:         z.string(),
  players:        z.array( userBase ),
  mode:           gameModeBase,
  status:         gameStatusBase,
  visibility:     gameVisibilityBase,
  createAt:       z.string().optional(),
});
const gameSchema = gameBase.meta( { $id: 'game' } );
const gameArraySchema = z.array(gameBase).meta( { $id: 'gameArray' } );

//schemas for POST
const gameCreateBase = z.object({
  userId:         z.number(),
  mode:           gameModeBase,
  visibility:     gameVisibilityBase,
  aiDifficulty:   aiDifficultyBase.optional(),
});
const gameCreateSchema = gameCreateBase.meta( { $id: 'gameCreate' } );

//schemas for GET
export const gameIdBase = z.object({
  id: z.string().uuid(),
});
export const gameIdSchema = gameIdBase.meta(  { $id: "gameId" } );

const gameQuerySchema = gameBase.partial().meta( { $id: 'gameQuery' } );

//schemas for response
const gameResponseSchema = gameBase.meta( { $id: "gameResponse" } );
const gameResponseArrayBase = z.array(gameBase)
const gameResponseArraySchema = gameResponseArrayBase.meta( { $id: "gameResponseArray" } );

//export schemas
export const gameSchemas = [
  gameSchema,
  gameArraySchema,
  gameCreateSchema,
  gameResponseSchema,
  gameResponseArraySchema,
  gameIdSchema,
  gameQuerySchema,
]


//export types
export type gameCreateInput = z.infer< typeof gameCreateSchema >;
export type gameIdInput = z.infer< typeof gameIdSchema >;
export type gameQueryInput = z.infer< typeof gameQuerySchema >;
export type gameResponseType = z.infer< typeof gameResponseSchema >;
export type gameResponseArrayType = z.infer< typeof gameResponseArraySchema >;

export type gameCreate = z.infer<typeof gameCreateSchema>;
export type game = z.infer<typeof gameSchema>;
