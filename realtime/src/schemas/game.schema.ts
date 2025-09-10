import { z } from 'zod/v4';
import { GameMode, GameSessionStatus, Direction, PaddleName } from '../constants/game.constants.js';
import { AIDifficulty } from '../constants/ai.constants.js';
import { UserIdSchema, UserSchema } from './user.schema.js';

export const GameIdSchema = z.string().min(1);

export const PaddleNameSchema = z.enum(PaddleName);

export const PlayerSchema = UserSchema.extend({
  sequence: z.number().default(0).optional(),
  isAI: z.boolean().optional().default(false),
  aiDifficulty: z.enum(AIDifficulty).optional(),
  paddle: PaddleNameSchema.optional(),
});

export const StartGameSchema = z.object({
  gameId: GameIdSchema,
  gameMode: z.enum(GameMode),
  players: z.array(PlayerSchema),
  aiDifficulty: z.enum(AIDifficulty).optional(),
});

export const GameResultSchema = z.object({
  gameId: GameIdSchema,
  scorePlayer1: z.number().int().min(0),
  scorePlayer2: z.number().int().min(0),
  winnerId: UserIdSchema.nullable(),
  loserId: UserIdSchema.nullable(),
  winnerName: z.string(),
  player1Username: z.string().nullable(),
  player2Username: z.string().nullable(),
  status: z.union([
    z.literal(GameSessionStatus.FINISHED),
    z.literal(GameSessionStatus.CANCELLED),
    z.literal(GameSessionStatus.CANCELLED_SERVER_ERROR),
  ]),
  mode: z.enum(GameMode),
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
  direction: z.enum(Direction),
  isAI: z.boolean().optional().default(false),
});

const BallSchema = z.object({
  x: z.number(),
  y: z.number(),
  dx: z.number(),
  dy: z.number(),
  v: z.number(),
  size: z.number().int().positive(),
});

export const GameStateSchema = z.object({
  gameId: GameIdSchema,
  ball: BallSchema,
  paddleA: PaddleSchema,
  paddleB: PaddleSchema,
  countdown: z.number().int().min(0).default(0),
  activePaddle: PaddleNameSchema,
  status: z.enum(GameSessionStatus),
  sequence: z.number().default(0),
});

export const GameSessionSchema = z.object({
  gameId: GameIdSchema,
  gameMode: z.enum(GameMode),
  players: z.array(PlayerSchema),
  isConnected: z.map(UserIdSchema, z.boolean()),
  status: z.enum(GameSessionStatus),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  gameLoopInterval: z.any().optional(),
  countdownInterval: z.any().optional(),
  gameState: GameStateSchema,
  aiDifficulty: z.enum(AIDifficulty).optional(),
});

export type StartGame = z.infer<typeof StartGameSchema>;
export type GameResult = z.infer<typeof GameResultSchema>;
export type GameState = z.infer<typeof GameStateSchema>;
export type GameSession = z.infer<typeof GameSessionSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type GameIdType = z.infer<typeof GameIdSchema>;
export type Paddle = z.infer<typeof PaddleSchema>;
export type BallType = z.infer<typeof BallSchema>;
