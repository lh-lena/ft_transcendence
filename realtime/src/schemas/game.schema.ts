// src/schemas/game.schema.ts
import { z } from 'zod';
import { GameMode, AIDifficulty, GameSessionStatus, Direction } from '../types/game.types.js';
import { UserSchema } from './user.schema.js';

export const StartGameSchema = z.object({
  gameId: z.string(),
  gameMode: z.nativeEnum(GameMode),
  players: z.array(UserSchema),
  aiDifficulty: z.nativeEnum(AIDifficulty).optional(),
});

export const GameResultSchema = z.object({
  gameId: z.string().uuid(),
  scorePlayer1: z.number().int().min(0),
  scorePlayer2: z.number().int().min(0),
  winnerId: z.number().int().positive().nullable(),
  loserId: z.number().int().positive().nullable(),
  player1Username: z.string().nullable(),
  player2Username: z.string().nullable(),
  status: z.union([
    z.literal(GameSessionStatus.FINISHED),
    z.literal(GameSessionStatus.CANCELLED),
    z.literal(GameSessionStatus.CANCELLED_SERVER_ERROR)
  ]),
  mode: z.nativeEnum(GameMode),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime(),
});

export type StartGame = z.infer<typeof StartGameSchema>;
export type GameResult = z.infer<typeof GameResultSchema>;
