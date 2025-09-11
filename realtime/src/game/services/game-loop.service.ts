import type { FastifyInstance } from 'fastify';
import type { GameSession } from '../../schemas/index.js';
import {
  PONG_CONFIG,
  NotificationType,
  GameSessionStatus,
  GameMode,
  AIDifficulty,
  GAME_EVENTS,
} from '../../constants/index.js';
import { processErrorLog } from '../../utils/error.handler.js';
import { updateGame, checkWinCondition } from '../../game/engines/pong/pong.engine.js';
import type { RespondService } from '../../websocket/types/ws.types.js';
import type { GameLoopService } from '../types/game.types.js';
import type { AIService } from '../../ai/ai.types.js';
import { broadcastGameUpdate } from '../utils/game.utils.js';

export default function createGameLoopService(app: FastifyInstance): GameLoopService {
  const activeGames = new Map<string, GameSession>();
  const lastTickAt = new Map<string, number>();
  let ticker: NodeJS.Timeout | undefined;
  const { log } = app;

  function startTicker(): void {
    if (ticker !== undefined) return;
    const respond = app.respond as RespondService;
    const targetFrameTime = 1000 / PONG_CONFIG.FPS;

    ticker = setInterval(() => {
      try {
        const now = performance.now();

        for (const game of activeGames.values()) {
          const { gameState } = game;
          const gameId = game.gameId;
          const last = lastTickAt.get(gameId) ?? now;
          let deltaTime = (now - last) / 1000;
          deltaTime = Math.min(deltaTime, PONG_CONFIG.FRAME_TIME_CAP_SECONDS);
          lastTickAt.set(gameId, now);

          if (game.status !== GameSessionStatus.ACTIVE) {
            activeGames.delete(gameId);
            lastTickAt.delete(gameId);
            continue;
          }

          if (gameState.countdown <= 0) {
            if (game.gameMode === GameMode.PVB_AI) {
              const aiService = app.aiService as AIService;
              aiService.processAILogic(gameState, deltaTime);
            }
            updateGame(gameState, deltaTime);
          }

          if (checkWinCondition(gameState)) {
            broadcastGameUpdate(respond, game.players, gameState);
            app.eventBus.emit(GAME_EVENTS.WIN_CONDITION_MET, { game, gameId });
            continue;
          }

          gameState.sequence++;
          broadcastGameUpdate(respond, game.players, gameState);
        }
      } catch (error: unknown) {
        processErrorLog(app, 'game-loop', 'Error in global ticker', error);
      }
    }, targetFrameTime);
  }

  function stopTicker(): void {
    if (ticker !== undefined) {
      clearInterval(ticker);
      ticker = undefined;
    }
  }

  function registerGame(game: GameSession): void {
    if (activeGames.has(game.gameId)) return;
    game.gameState.sequence = 0;
    activeGames.set(game.gameId, game);
    lastTickAt.set(game.gameId, performance.now());
    startTicker();
  }

  function unregisterGame(gameId: string): void {
    activeGames.delete(gameId);
    lastTickAt.delete(gameId);
    if (activeGames.size === 0) {
      stopTicker();
    }
  }

  function startGameLoop(game: GameSession): void {
    if (game === undefined || game === null) {
      log.warn(`[game-loop] Cannot start game loop - game not found`);
      return;
    }
    registerGame(game);
  }

  function stopGameLoop(game: GameSession): void {
    unregisterGame(game.gameId);
    // stopAIGame(game);
  }

  function startCountdownSequence(game: GameSession, infoMsg: string, count: number = 3): void {
    const respond = app.respond as RespondService;
    if (game !== undefined && game.countdownInterval !== undefined) {
      clearInterval(game.countdownInterval);
    }

    game.gameState.countdown = count;
    respond.countdownUpdate(game.gameId, count, count === 0 ? 'GO!' : count.toString());

    game.countdownInterval = setInterval(() => {
      if (game.status !== GameSessionStatus.ACTIVE) {
        clearInterval(game.countdownInterval);
        game.countdownInterval = undefined;
        log.info(
          `[game-loop] Countdown interrupted for game ${game.gameId}. Status: ${game.status}`,
        );
        return;
      }

      count--;
      game.gameState.countdown = count;
      const message = count === 0 ? 'GO!' : count.toString();
      respond.countdownUpdate(game.gameId, count, message);

      if (count === 0) {
        clearInterval(game.countdownInterval);
        game.countdownInterval = undefined;
        respond.notificationToGame(game.gameId, NotificationType.INFO, infoMsg);
        registerGame(game);
        // startAIGame(game);
      }
    }, PONG_CONFIG.COUNTDOWN_INTERVAL);
  }

  function stopCountdownSequence(game: GameSession): void {
    if (game === undefined || game === null) return;
    if (game.countdownInterval !== undefined) {
      clearInterval(game.countdownInterval);
      game.countdownInterval = undefined;
      log.info(
        `[game-loop] Countdown stopped for game ${game.gameId} due to pause/leave/disconnect`,
      );
    }
  }

  function startAIGame(game: GameSession): void {
    if (game.gameMode !== GameMode.PVB_AI) return;
    const aiService = app.aiService as AIService;
    aiService.startAI(game.gameId, game.aiDifficulty as AIDifficulty);
    log.info(`[game-loop] AI system started for game ${game.gameId}`);
  }

  function stopAIGame(game: GameSession): void {
    if (game.gameMode !== GameMode.PVB_AI) return;
    const aiService = app.aiService as AIService;
    aiService.stopAI(game.gameId);
    log.info(`[game-loop] AI system stopped for game ${game.gameId}`);
  }

  return {
    startGameLoop,
    stopGameLoop,
    startCountdownSequence,
    stopCountdownSequence,
  };
}
