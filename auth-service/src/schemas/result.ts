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

export const 
