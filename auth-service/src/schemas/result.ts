import { z } from 'zod/v4';

export const leaderboardSchema = z.object({
  userID: z.uuid(),
  wins: z.number(),
});

export const resultPostSchema = z.object({
  gameId: z.uuid(),
  scorePlayer1: z.number(),
  scorePlayer2: z.number(),
  winnerId: z.uuid(),
  loserId: z.uuid(),
  player1Username: z.string(),
  player2Username: z.string(),
  status: z.string(),
  startedAt: z.string(),
  finishedAt: z.string(),
});

export const resultResponseSchema = z.object({
  resultId: z.number(),
  gameId: z.uuid(),
  startedAt: z.string(),
  finishedAt: z.string(),
  status: z.string(),
  winnerId: z.uuid(),
  loserId: z.uuid(),
  winnerScore: z.number(),
  loserScore: z.number(),
});
export const resultResponseArraySchema = z.array(resultResponseSchema);

export const resultQuerySchema = resultResponseSchema.partial();

export type LeaderboardType = z.infer<typeof leaderboardSchema>;
export type ResultPostType = z.infer<typeof resultPostSchema>;
export type ResultResponseType = z.infer<typeof resultResponseSchema>;
export type ResultResponseArrayType = z.infer<typeof resultResponseArraySchema>;
export type ResultQueryType = z.infer<typeof resultQuerySchema>;
