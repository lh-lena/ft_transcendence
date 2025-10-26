import type { AIDifficulty } from '../constants/ai.constants.js';
import type { GameState, GameIdType, Paddle, BallType } from '../schemas/game.schema.js';
import { Direction } from '../constants/game.constants.js';
import type { aiConfigType, aiState } from '../schemas/ai.schema.js';

export interface AIService {
  startAI(gameId: GameIdType, difficulty: AIDifficulty): void;
  stopAI(gameId: GameIdType): void;
  processAILogic(gameState: GameState, deltaTime: number): void;
  getAIState(gameId: GameIdType): aiState | undefined;
}

export interface AIStateManager {
  createAIState(gameId: GameIdType, difficulty: AIDifficulty): void;
  getAIState(gameId: GameIdType): aiState | undefined;
  updateAIState(gameId: GameIdType, updates: Partial<aiState>): void;
  removeAIState(gameId: GameIdType): void;
  hasAIState(gameId: GameIdType): boolean;
  clearAllAIStates(): void;
}

export interface AIPredictionEngine {
  calculateTargetPosition(ball: BallType, aiPaddle: Paddle, config: aiConfigType): number;
  ballTrajectoryPrediction(
    ball: BallType,
    aiPaddle: Paddle,
    timeAhead: number,
  ): { x: number; y: number };
  calculateTimeToPaddle(paddleX: number, ballX: number, dx: number, velocity: number): number;
}

export interface AIMovementController {
  updateDirection(aiState: aiState, aiPaddle: Paddle): Direction;
}

export interface AITimingService {
  updateTimeAccumulator(currentAccumulator: number, deltaTime: number): number;
  resetTimeAccumulator(): number;
  shouldUpdateDecision(timeAccumulator: number, aiInterval: number, reactionTime: number): boolean;
}
