import type { FastifyInstance } from 'fastify';
import type { AIService } from './ai.types.js';
import type { GameIdType, GameState } from '../schemas/game.schema.js';
import { AIDifficulty } from '../constants/index.js';
import { getAIPaddle } from '../game/utils/player.utils.js';
import createAIStateManager from './ai-state.manager.js';
import type { EnvironmentConfig } from '../config/config.js';
import createAIPredictionEngine from './ai-prediction.engine.js';
import createAIMovementController from './ai-movement.controller.js';

export default function createAIService(app: FastifyInstance): AIService {
  const { log } = app;
  const config = app.config as EnvironmentConfig;
  const aiStateManager = createAIStateManager(app);
  const aiPredictionEngine = createAIPredictionEngine(app);
  const aiMovementController = createAIMovementController(app);

  function updateAIDecision(gameState: GameState, deltaTime: number, aiInterval: number): void {
    const { gameId } = gameState;
    const aiState = aiStateManager.getAIState(gameId);
    if (aiState === undefined) return;

    aiStateManager.updateAIState(gameId, {
      timeAccumulator: aiState.timeAccumulator + deltaTime,
    });
    if (aiState.timeAccumulator < aiInterval) {
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
    if (aiState === undefined) return;

    const direction = aiMovementController.updateMovement(aiState, aiPaddle);
    aiStateManager.updateAIState(gameId, {
      currentDirection: direction,
    });
    aiPaddle.direction = direction;
  }

  function resetTimeAccumulator(): number {
    return 0;
  }

  function startAI(gameId: GameIdType, difficulty: AIDifficulty): void {
    if (aiStateManager.hasAIState(gameId)) {
      log.warn(`[ai-service] AI is already running for game ${gameId}`);
      return;
    }

    const finalDifficulty = difficulty ?? AIDifficulty.MEDIUM;
    aiStateManager.createAIState(gameId, finalDifficulty);
    log.debug(`[ai-service] AI initialized for game ${gameId} with difficulty ${finalDifficulty}`);
  }

  function stopAI(gameId: GameIdType): void {
    if (aiStateManager.hasAIState(gameId)) {
      aiStateManager.removeAIState(gameId);
      log.debug(`[ai-service] AI stopped for game ${gameId}`);
    }
  }

  function processAILogic(gameState: GameState, deltaTime: number): void {
    updateAIDecision(gameState, deltaTime, config.ai.interval);
    updateAIMovement(gameState);
  }

  return {
    startAI,
    stopAI,
    processAILogic,
  };
}
