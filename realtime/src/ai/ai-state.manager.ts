import type { FastifyInstance } from 'fastify';
import type { GameIdType } from '../schemas/game.schema.js';
import type { AIDifficulty } from '../constants/ai.constants.js';
import type { aiState } from '../schemas/ai.schema.js';
import { AIConfig } from '../constants/ai.constants.js';
import { BOARD_DEFAULTS, Direction } from '../constants/game.constants.js';
import type { AIStateManager } from './ai.types.js';
import type { EnvironmentConfig } from '../config/config.js';

export default function createAIStateManager(app: FastifyInstance): AIStateManager {
  const aiStates: Map<string, aiState> = new Map();
  const { log } = app;
  const config = app.config as EnvironmentConfig;
  const aiInterval = config.ai.interval;

  function createAIState(gameId: GameIdType, difficulty: AIDifficulty): aiState {
    const aiState: aiState = {
      gameId,
      targetDirection: Direction.STOP,
      currentDirection: Direction.STOP,
      targetYPosition: BOARD_DEFAULTS.height / 2,
      timeAccumulator: aiInterval,
      difficulty,
      config: AIConfig[difficulty],
      lastProcessedSequence: 0,
    };

    aiStates.set(gameId, aiState);
    return aiState;
  }

  function getAIState(gameId: GameIdType): aiState | undefined {
    if (!aiStates.has(gameId)) {
      return undefined;
    }
    const state = aiStates.get(gameId);
    return state;
  }

  function updateAIState(gameId: GameIdType, updates: Partial<aiState>): void {
    const currentState = aiStates.get(gameId);
    if (currentState === undefined) {
      log.warn(`[ai-state-manager] Attempted to update non-existent AI state for game ${gameId}`);
      return;
    }
    const updatedState = { ...currentState, ...updates };
    aiStates.set(gameId, updatedState);
  }

  function removeAIState(gameId: GameIdType): void {
    aiStates.delete(gameId);
  }

  function hasAIState(gameId: GameIdType): boolean {
    return aiStates.has(gameId);
  }

  function clearAllAIStates(): void {
    aiStates.clear();
  }

  return {
    createAIState,
    getAIState,
    updateAIState,
    removeAIState,
    hasAIState,
    clearAllAIStates,
  };
}
