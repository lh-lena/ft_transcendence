import { z } from 'zod/v4';
import { userBase } from './user';
import { dtString } from './basics';

//define game mode
export const gameModeBase = z.enum(['pvp_remote', 'pvp_ai', 'tournament']);

//define game status
const gameStatusBase = z.enum(['waiting', 'ready', 'playing', 'finished']);

//define ai diff
const aiDifficultyBase = z.enum(['easy', 'medium', 'hard']);

//define game visibility for tournaments
const gameVisibilityBase = z.enum(['public', 'private']);

//game object
const gameBase = z.object({
  gameId: z.string(),
  players: z.array(userBase),
  mode: gameModeBase,
  status: gameStatusBase,
  visibility: gameVisibilityBase,
  createdAt: dtString.optional(),
});
const gameSchema = gameBase.meta({ $id: 'game' });
const gameArraySchema = z.array(gameBase).meta({ $id: 'gameArray' });

//schemas for POST
const gameCreateBase = z.object({
  userId: z.number(),
  mode: gameModeBase,
  visibility: gameVisibilityBase,
  aiDifficulty: aiDifficultyBase.optional(),
});
const gameCreateSchema = gameCreateBase.meta({ $id: 'gameCreate' });

//schemas for GET
export const gameIdBase = z.object({
  id: z.uuid(),
});
export const gameIdSchema = gameIdBase.meta({ $id: 'gameId' });

const gameQuerySchema = gameBase.partial().meta({ $id: 'gameQuery' });

//schemas for response
const gameResponseSchema = gameBase.meta({ $id: 'gameResponse' });
const gameResponseArrayBase = z.array(gameBase);
const gameResponseArraySchema = gameResponseArrayBase.meta({
  $id: 'gameResponseArray',
});

//export schemas
export const gameSchemas = [
  gameSchema,
  gameArraySchema,
  gameCreateSchema,
  gameResponseSchema,
  gameResponseArraySchema,
  gameIdSchema,
  gameQuerySchema,
];

//export types
export type game = z.infer<typeof gameSchema>;
export type gameCreateInput = z.infer<typeof gameCreateSchema>;
export type gameIdInput = z.infer<typeof gameIdSchema>;
export type gameQueryInput = z.infer<typeof gameQuerySchema>;
export type gameResponseType = z.infer<typeof gameResponseSchema>;
export type gameResponseArrayType = z.infer<typeof gameResponseArraySchema>;
