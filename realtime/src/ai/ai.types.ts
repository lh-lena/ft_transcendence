import type { AIDifficulty } from '../constants/ai.constants.js';
import type { GameState, GameIdType, Paddle, BallType } from '../schemas/game.schema.js';
import { Direction } from '../constants/game.constants.js';
import type { aiConfigType } from '../schemas/ai.schema.js';
import type { aiState } from '../schemas/ai.schema.js';

export interface AIService {
  startAI(gameId: GameIdType, difficulty: AIDifficulty): void;
  stopAI(gameId: GameIdType): void;
  processAILogic(gameState: GameState, deltaTime: number): void;
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
}

export interface AIMovementController {
  updateMovement(aiState: aiState, aiPaddle: Paddle): Direction;
}

export interface AITimingService {
  updateTimeAccumulator(currentAccumulator: number, deltaTime: number): number;
  resetTimeAccumulator(): number;
  shouldUpdateDecision(timeAccumulator: number, aiInterval: number, reactionTime: number): boolean;
}
