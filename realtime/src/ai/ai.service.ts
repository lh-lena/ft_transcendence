import type { FastifyInstance } from 'fastify';
import type { AIService } from './ai.types.js';
import type { GameIdType, GameState } from '../schemas/game.schema.js';
import { AIDifficulty, GAME_EVENTS } from '../constants/index.js';
import { getAIPaddle } from '../game/utils/player.utils.js';
import createAIStateManager from './ai-state.manager.js';
import type { EnvironmentConfig } from '../config/config.js';
import createAIPredictionEngine from './ai-prediction.engine.js';
import createAIMovementController from './ai-movement.controller.js';
import type { aiState } from '../schemas/ai.schema.js';
import { User } from '../schemas/index.js';

export default function createAIService(app: FastifyInstance): AIService {
  const { log } = app;
  const config = app.config as EnvironmentConfig;
  const aiStateManager = createAIStateManager(app);
  const aiPredictionEngine = createAIPredictionEngine();
  const aiMovementController = createAIMovementController();

  function updateAIDecision(gameState: GameState, deltaTime: number, aiInterval: number): void {
    const { gameId } = gameState;
    const aiState = aiStateManager.getAIState(gameId);
    if (aiState === undefined) {
      log.warn(`[ai-service] No AI state found for game ${gameId}`);
      return;
    }

    const deltaTimeMs = deltaTime * 1000;
    const newTimeAccumulator = aiState.timeAccumulator + deltaTimeMs;
    aiStateManager.updateAIState(gameId, {
      timeAccumulator: newTimeAccumulator,
    });

    if (newTimeAccumulator < aiInterval) {
      return;
    }
    const aiPaddle = getAIPaddle(gameState);
    if (aiPaddle === undefined) {
      log.warn(`[ai-service] No AI paddle found in game ${gameId}`);
      return;
    }

    const targetYPosition = aiPredictionEngine.calculateTargetPosition(
      gameState.ball,
      aiPaddle,
      aiState.config,
    );
    aiStateManager.updateAIState(gameId, {
      targetYPosition,
      timeAccumulator: resetTimeAccumulator(),
    });
  }

  function updateAIMovement(gameState: GameState): void {
    const { gameId } = gameState;
    const aiPaddle = getAIPaddle(gameState);
    if (aiPaddle === undefined) {
      log.warn(`[ai-service] No AI paddle found in game ${gameId}`);
      return;
    }

    const aiState = aiStateManager.getAIState(gameId);
    if (aiState === undefined) {
      log.warn(`[ai-service] No AI state found for game ${gameId}`);
      return;
    }

    const aiUserId = aiPaddle.userId;
    if (aiUserId === undefined) {
      log.warn(`[ai-service] AI paddle in game ${gameId} has no associated userId`);
      return;
    }
    const direction = aiMovementController.updateDirection(aiState, aiPaddle);
    const payload = {
      gameId,
      direction,
      sequence: aiState.lastProcessedSequence++,
    };
    const user: User = {
      userId: aiUserId,
      username: 'AI Bot',
      userAlias: 'AI Bot',
      isAI: true,
    };
    app.eventBus.emit(GAME_EVENTS.UPDATE, { user, payload });
  }

  function resetTimeAccumulator(): number {
    return 0;
  }

  function startAI(gameId: GameIdType, difficulty: AIDifficulty): void {
    if (aiStateManager.hasAIState(gameId)) {
      log.warn(`[ai-service] AI is already running for game ${gameId}`);
      return;
    }

    if (difficulty === undefined || difficulty === null) {
      difficulty = AIDifficulty.MEDIUM;
    }
    aiStateManager.createAIState(gameId, difficulty);
    log.debug(`[ai-service] AI initialized for game ${gameId} with difficulty ${difficulty}`);
  }

  function stopAI(gameId: GameIdType): void {
    const aiState = aiStateManager.getAIState(gameId);
    if (aiState === undefined) {
      log.warn(`[ai-service] AI is not running for game ${gameId}`);
      return;
    }
    aiStateManager.removeAIState(gameId);
  }

  function processAILogic(gameState: GameState, deltaTime: number): void {
    updateAIDecision(gameState, deltaTime, config.ai.interval);
    updateAIMovement(gameState);
  }

  function getAIState(gameId: GameIdType): aiState | undefined {
    return aiStateManager.getAIState(gameId);
  }

  return {
    startAI,
    stopAI,
    processAILogic,
    getAIState,
  };
}
