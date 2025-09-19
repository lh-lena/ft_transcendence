import { z } from 'zod/v4';
import { userIdSchema } from './user';

export const gameJoinSchema = z.object({
  gameId: z.uuid().optional(),
  userId: z.uuid(),
});

export const gameSchema = z.object({
  gameId: z.uuid(),
  players: z.array(userIdSchema),
  mode: z.string(),
  status: z.string(),
  visibility: z.string(),
  aiDifficulty: z.string().optional(),
  createdAt: z.string(),
});

export const gameIdSchema = gameSchema.pick({ gameId: true });
export const gameCreateSchema = gameSchema
  .omit({ gameId: true, players: true, createdAt: true, status: true })
  .extend({ userId: z.uuid() });

export const gameResponseSchema = gameSchema;
export const gameResponseArraychema = z.array(gameResponseSchema);

export type GameType = z.infer<typeof gameSchema>;
export type GameCreateType = z.infer<typeof gameCreateSchema>;
export type GameJoinType = z.infer<typeof gameJoinSchema>;
export type GameIdType = z.infer<typeof gameIdSchema>;
export type GameResponseType = z.infer<typeof gameResponseSchema>;
export type GameResponseArrayType = z.infer<typeof gameResponseArraychema>;
