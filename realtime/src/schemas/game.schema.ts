import { z } from 'zod/v4';
import { GameMode, GameSessionStatus, Direction, PaddleName } from '../constants/game.constants.js';
import { AIDifficulty } from '../constants/ai.constants.js';
import { UserIdSchema, UserSchema } from './user.schema.js';

export const GameIdSchema = z.uuidv4();

export const PaddleNameSchema = z.enum(PaddleName);

export const PlayerSchema = UserSchema.extend({
  sequence: z.number().default(0).optional(),
  aiDifficulty: z.enum(AIDifficulty).optional(),
  paddle: PaddleNameSchema.optional(),
});

export const BackendStartGameSchema = z.object({
  gameId: GameIdSchema,
  mode: z.enum(GameMode),
  players: z.array(z.object({ userId: UserIdSchema })),
  aiDifficulty: z.enum(AIDifficulty).optional(),
});

export const StartGameSchema = z.object({
  gameId: GameIdSchema,
  mode: z.enum(GameMode),
  players: z.array(PlayerSchema),
  aiDifficulty: z.enum(AIDifficulty).optional(),
});

export const GameResultSchema = z
  .object({
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
  })
  .meta({ $id: 'GameResultPayload' });

const PaddleSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  score: z.number().int().min(0),
  speed: z.number().int().positive(),
  direction: z.enum(Direction),
  isAI: z.boolean().optional().default(false),
  userId: UserIdSchema.optional(),
});

const BallSchema = z.object({
  x: z.number(),
  y: z.number(),
  dx: z.number(),
  dy: z.number(),
  v: z.number(),
  size: z.number().int().positive(),
});

export const GameStateSchema = z
  .object({
    gameId: GameIdSchema,
    ball: BallSchema,
    paddleA: PaddleSchema,
    paddleB: PaddleSchema,
    countdown: z.number().int().min(0).default(0),
    activePaddle: PaddleNameSchema,
    status: z.enum(GameSessionStatus),
    sequence: z.number().default(0),
  })
  .meta({ $id: 'GameStatePayload' });

export const GameSessionSchema = z.object({
  gameId: GameIdSchema,
  mode: z.enum(GameMode),
  players: z.array(PlayerSchema),
  isConnected: z.map(UserIdSchema, z.boolean()),
  playersReady: z.array(UserIdSchema),
  status: z.enum(GameSessionStatus),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  gameLoopInterval: z.any().optional(),
  countdownInterval: z.any().optional(),
  gameState: GameStateSchema,
  aiDifficulty: z.enum(AIDifficulty).optional(),
});

export const GameStartRequestSchema = {
  type: 'object',
  properties: {
    gameId: { type: 'string', format: 'uuid' },
    players: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          userId: { type: 'string', format: 'uuid' },
        },
        required: ['userId'],
      },
    },
    aiDifficulty: {
      type: 'string',
      enum: [AIDifficulty.EASY, AIDifficulty.MEDIUM, AIDifficulty.HARD],
    },
    mode: {
      type: 'string',
      enum: [GameMode.PVP_REMOTE, GameMode.PVB_AI, GameMode.PVP_LOCAL],
    },
  },
  required: ['gameId', 'players', 'mode'],
};

export type StartGame = z.infer<typeof StartGameSchema>;
export type BackendStartGame = z.infer<typeof BackendStartGameSchema>;
export type GameResult = z.infer<typeof GameResultSchema>;
export type GameState = z.infer<typeof GameStateSchema>;
export type GameSession = z.infer<typeof GameSessionSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type GameIdType = z.infer<typeof GameIdSchema>;
export type Paddle = z.infer<typeof PaddleSchema>;
export type BallType = z.infer<typeof BallSchema>;
