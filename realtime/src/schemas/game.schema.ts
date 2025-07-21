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
  gameId: z.string(),
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
  startedAt: z.string(),
  finishedAt: z.string(),
});

const PaddleSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  score: z.number().int().min(0),
  speed: z.number().int().positive(),
  direction: z.nativeEnum(Direction),
});

export const GameStateSchema = z.object({
  gameId: z.string(),
  ball: z.object({
    x: z.number(),
    y: z.number(),
    dx: z.number(),
    dy: z.number(),
    v: z.number()
  }),
  paddleA: PaddleSchema,
  paddleB: PaddleSchema,
  countdown: z.number().int().min(0).default(0),
  activePaddle: z.literal('paddleA').or(z.literal('paddleB')),
  status: z.nativeEnum(GameSessionStatus),
  sequence: z.number().default(0),
});

export const GameSessionSchema = z.object({
  gameId: z.string(),
  gameMode: z.nativeEnum(GameMode),
  players: z.array(UserSchema),
  isConnected: z.map(z.number(), z.boolean()),
  status: z.nativeEnum(GameSessionStatus),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  gameLoopInterval: z.any().optional(),
  lastSequence: z.number().default(0),
  countdownInterval: z.any().optional(),
  gameState: GameStateSchema,
});

export type StartGame = z.infer<typeof StartGameSchema>;
export type GameResult = z.infer<typeof GameResultSchema>;
export type GameState = z.infer<typeof GameStateSchema>;
export type GameSession = z.infer<typeof GameSessionSchema>;