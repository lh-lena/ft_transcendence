import { z } from 'zod/v4';
import { userBase, userQueryBase } from './user';
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
export const gameBase = z.object({
  gameId: z.string(),
  players: z.array(userBase),
  mode: gameModeBase,
  status: gameStatusBase,
  visibility: gameVisibilityBase,
  createdAt: dtString.optional(),
});

//schemas for POST
const gameCreateBase = z.object({
  userId: z.number(),
  mode: gameModeBase,
  visibility: gameVisibilityBase,
  aiDifficulty: aiDifficultyBase.optional(),
});
export const gameCreate = gameCreateBase.meta({ $id: 'gameCreate' });

//schemas for GET
export const gameIdBase = z.object({
  id: z.uuid(),
});
export const gameId = gameIdBase.meta({ $id: 'gameId' });

const gameQueryBase = gameBase
  .extend({ players: z.object({ some: userQueryBase }).optional() })
  .partial();
const gameQuery = gameQueryBase.meta({ $id: 'gameQuery' });

//schemas for response
const gameResponse = gameBase.meta({ $id: 'gameResponse' });
const gameResponseArray = z.array(gameBase).meta({ $id: 'gameResponseArray' });

//export schemas
export const gameSchemas = [
  gameCreate,
  gameResponse,
  gameResponseArray,
  gameId,
  gameQuery,
];
//
////export types
export type game = z.infer<typeof gameBase>;
export type gameCreateType = z.infer<typeof gameCreate>;
export type gameIdType = z.infer<typeof gameId>;
export type gameQueryType = z.infer<typeof gameQuery>;
export type gameResponseType = z.infer<typeof gameResponse>;
export type gameResponseArrayType = z.infer<typeof gameResponseArray>;
