import { z } from 'zod/v4';
import { userInfo } from './user';
import { dtString, status } from './basics';

//define game mode
export const gameModeBase = z.enum(['pvp_remote', 'pvb_ai', 'tournament']);

//define ai diff
const aiDifficultyBase = z.enum(['easy', 'medium', 'hard']);

//define game visibility for tournaments
const gameVisibilityBase = z.enum(['public', 'private']);

//game object
export const gameBase = z.object({
  gameId: z.uuid(),
  players: z.array(userInfo),
  mode: gameModeBase,
  status: status.default('waiting'),
  visibility: gameVisibilityBase.default('public'),
  aiDifficulty: aiDifficultyBase.optional(),
  createdAt: dtString.optional(),
});

//schemas for POST
const gameCreateBase = gameBase.pick({
  mode: true,
  visibility: true,
  aiDifficulty: true,
});
export const gameCreate = gameCreateBase.meta({ $id: 'gameCreate' });

const gameJoinBase = gameCreateBase.extend({
  gameId: z.uuid().optional(),
  playerId: z.uuid(),
});
const gameJoin = gameJoinBase
  .meta({ $id: 'gameJoin' })
  .describe('Join a game, optionally with gameId to join specific game.');

//schemas for GET
export const gameIdBase = z.object({
  id: z.uuid(),
});
export const gameId = gameIdBase.meta({ $id: 'gameId' });

//schemas for response
const gameResponse = gameBase.meta({ $id: 'gameResponse' });
const gameResponseArray = z.array(gameBase).meta({ $id: 'gameResponseArray' });

//export schemas
export const gameSchemas = [gameCreate, gameJoin, gameResponse, gameResponseArray, gameId];
//
////export types
export type gameType = z.infer<typeof gameBase>;
export type gameCreateType = z.infer<typeof gameCreate>;
export type gameJoinType = z.infer<typeof gameJoin>;
export type gameIdType = z.infer<typeof gameId>;
export type gameResponseType = z.infer<typeof gameResponse>;
export type gameResponseArrayType = z.infer<typeof gameResponseArray>;
