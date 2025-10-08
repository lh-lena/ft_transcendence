import type { FastifyInstance } from 'fastify';
import type { GameSession, GameIdType, UserIdType, GameResult } from '../../schemas/index.js';
import type { PausedGameState } from '../../websocket/types/network.types.js';
import {
  PONG_CONFIG,
  NotificationType,
  GameSessionStatus,
  GameMode,
} from '../../constants/index.js';
import { processErrorLog, processDebugLog } from '../../utils/error.handler.js';
import { resetGameState } from '../../game/engines/pong/pong.engine.js';
import type { ConnectionService, RespondService } from '../../websocket/types/ws.types.js';
import type {
  GameSessionService,
  GameDataService,
  GameStateService,
  GameLoopService,
} from '../types/game.types.js';
import type { EnvironmentConfig } from '../../config/config.js';
import {
  createGameResult,
  broadcastGameUpdate,
  assignPaddleToPlayers,
  getUserIdObjectArray,
  createGameValidator,
} from '../utils/index.js';

export default function createGameStateService(app: FastifyInstance): GameStateService {
  const pausedGames: Map<GameIdType, PausedGameState> = new Map();
  const pauseTimeouts: Map<GameIdType, NodeJS.Timeout> = new Map();
  const config = app.config as EnvironmentConfig;
  const validator = createGameValidator(app);

  function updateGameToActive(game: GameSession): void {
    if (game === undefined || game === null) return;
    const gameSessionService = app.gameSessionService as GameSessionService;
    const startedAt =
      game.startedAt !== null && game.startedAt !== undefined
        ? game.startedAt
        : Date.now().toString();
    const { gameState } = game;
    gameState.status = GameSessionStatus.ACTIVE;
    gameState.countdown = PONG_CONFIG.COUNTDOWN;
    gameSessionService.updateGameSession(game.gameId, {
      startedAt: startedAt,
      status: GameSessionStatus.ACTIVE,
    });
    processDebugLog(app, 'game-state', `Game ${game.gameId} updated to ACTIVE status`);
  }

  function updateGameToPaused(game: GameSession): void {
    if (game === undefined || game === null) return;
    const gameSessionService = app.gameSessionService as GameSessionService;
    const { gameState } = game;
    gameState.status = GameSessionStatus.PAUSED;
    gameState.countdown = 0;
    gameSessionService.updateGameSession(game.gameId, {
      status: GameSessionStatus.PAUSED,
    });
    processDebugLog(app, 'game-state', `Game ${game.gameId} updated to PAUSED status`);
  }

  function updateGameToEnded(game: GameSession, status: GameSessionStatus): void {
    const gameSessionService = app.gameSessionService as GameSessionService;
    const { gameState } = game;
    gameState.status = status;
    gameState.countdown = 0;
    gameSessionService.updateGameSession(game.gameId, {
      status: status,
      finishedAt: Date.now().toString(),
    });
    processDebugLog(app, 'game-state', `Game ${game.gameId} updated to ENDED status: ${status}`);
  }

  function storePausedGameInfo(game: GameSession, pausedByPlayerId: UserIdType): void {
    const existingPausedGame = pausedGames.get(game.gameId);
    if (existingPausedGame) {
      existingPausedGame.pausedAt = Date.now();
      existingPausedGame.playersWhoPaused.add(pausedByPlayerId);
      existingPausedGame.pausedByPlayerId = pausedByPlayerId;
    } else {
      const pausedInfo: PausedGameState = {
        gameId: game.gameId,
        pausedByPlayerId,
        pausedAt: Date.now(),
        players: game.players,
        playersWhoPaused: new Set([pausedByPlayerId]),
      };
      pausedGames.set(game.gameId, pausedInfo);
    }
  }

  function removePausedGameInfo(gameId: GameIdType): void {
    pausedGames.delete(gameId);
    stopAutoResume(gameId);
  }

  function stopAutoResume(gameId: GameIdType): void {
    const existingTimeout = pauseTimeouts.get(gameId);
    if (existingTimeout !== undefined) {
      clearTimeout(existingTimeout);
      pauseTimeouts.delete(gameId);
    }
  }

  function setAutoResume(game: GameSession): void {
    if (game === undefined || game === null) return;
    const { gameId } = game;
    const pauseTimeout = setTimeout(() => {
      try {
        processDebugLog(
          app,
          'game-state',
          `Auto-resuming game ${gameId} after pause timeout ${config.websocket.pauseTimeout / 1000}s`,
        );
        pauseTimeouts.delete(gameId);
        resumeGame(game);
      } catch (error: unknown) {
        processDebugLog(app, 'game-state', `Cannot handle auto-resume for game ${gameId}:`, error);
      }
    }, config.websocket.pauseTimeout);
    pauseTimeouts.set(gameId, pauseTimeout);
  }

  function cleanupGameResources(game: GameSession): void {
    const gameSessionService = app.gameSessionService as GameSessionService;
    const connectionService = app.connectionService as ConnectionService;
    if (game === undefined || game === null) {
      processErrorLog(app, 'game-state', `Game not found during cleanup`);
      return;
    }
    const { gameId } = game;
    processDebugLog(app, 'game-state', `Cleaning up resources for game ${gameId}`);
    try {
      const pauseTimeout = pauseTimeouts.get(gameId);
      if (pauseTimeout) {
        clearTimeout(pauseTimeout);
        pauseTimeouts.delete(gameId);
      }
      game.players.forEach((player) => {
        if (game.isConnected.get(player.userId) === true) {
          connectionService.updateUserGame(player.userId, null);
        }
      });
      gameSessionService.removeGameSession(gameId);
      pausedGames.delete(gameId);
      processDebugLog(app, 'game-state', `Successfully cleaned up game ${gameId}`);
    } catch (error: unknown) {
      processErrorLog(app, 'game-state', `Error cleaning up game ${gameId}: `, error);
    }
  }

  function startGame(game: GameSession): void {
    if (game === undefined || game === null || !validator.gameReadyToStart(game)) return;
    processDebugLog(app, 'game-state', `Starting the game ${game.gameId}`);
    const gameLoopService = app.gameLoopService as GameLoopService;
    const respond = app.respond as RespondService;
    updateGameToActive(game);
    resetGameState(game.gameState);
    assignPaddleToPlayers(game);
    respond.gameStarted(game.gameId, getUserIdObjectArray(game.players));
    // broadcastGameUpdate(respond, game.players, game.gameState); // rm ??
    gameLoopService.startCountdownSequence(game, 'Game started!', PONG_CONFIG.COUNTDOWN);
  }

  function pauseGame(game: GameSession, pausedByPlayerId: UserIdType): boolean {
    if (game === undefined || game === null) {
      processErrorLog(app, 'game-state', `Cannot pause - game not found`);
      return false;
    }
    const respond = app.respond as RespondService;
    const { gameId, status } = game;
    if (status === GameSessionStatus.PAUSED) {
      processDebugLog(app, 'game-state', `Game ${gameId} is already paused, skipping pause`);
      return false;
    }
    const existingPausedGame = pausedGames.get(gameId);
    if (
      existingPausedGame !== undefined &&
      existingPausedGame.playersWhoPaused.has(pausedByPlayerId)
    ) {
      processDebugLog(
        app,
        'game-state',
        `Player ${pausedByPlayerId} has already used their pause in game ${gameId}`,
      );
      respond.notification(
        pausedByPlayerId,
        NotificationType.WARN,
        `you have used your pause for this game`,
      );
      return false;
    }
    const gameLoopService = app.gameLoopService as GameLoopService;
    gameLoopService.stopGameLoop(game);
    updateGameToPaused(game);
    storePausedGameInfo(game, pausedByPlayerId);
    setAutoResume(game);
    return true;
  }

  function resumeGame(game: GameSession, resumeByPlayerId?: UserIdType): void {
    if (game === undefined || game === null) {
      processErrorLog(app, 'game-state', `Cannot resume - game not found`);
      return;
    }
    const { gameId } = game;
    const pausedState = pausedGames.get(gameId) as PausedGameState;
    const respond = app.respond as RespondService;
    validator.validateResumingGame(pausedState, game, resumeByPlayerId);
    stopAutoResume(gameId);
    updateGameToActive(game);
    broadcastGameUpdate(respond, game.players, game.gameState);
    const gameLoopService = app.gameLoopService as GameLoopService;
    gameLoopService.startCountdownSequence(game, 'Game resumed!', PONG_CONFIG.COUNTDOWN);
  }

  async function endGame(
    game: GameSession,
    status:
      | GameSessionStatus.CANCELLED
      | GameSessionStatus.FINISHED
      | GameSessionStatus.CANCELLED_SERVER_ERROR,
    leftPlayerId?: UserIdType,
  ): Promise<void> {
    if (game === undefined || game === null) {
      processErrorLog(app, 'game-state', `Cannot end - game not found`);
      return;
    }
    const respond = app.respond as RespondService;
    const { gameId } = game;
    processDebugLog(app, 'game-state', `Ending game ${gameId} with status: ${status}`);
    const gameLoopService = app.gameLoopService as GameLoopService;
    gameLoopService.stopCountdownSequence(game);
    gameLoopService.stopGameLoop(game);
    updateGameToEnded(game, status);
    removePausedGameInfo(gameId);
    const result = createGameResult(game, status, leftPlayerId);
    if (result.isErr()) {
      processErrorLog(
        app,
        'game-state',
        `Error creating game result for game ${gameId}`,
        result.error,
      );
      return;
    }
    respond.gameEnded(gameId, result.value);
    await processGameResult(result.value);
    cleanupGameResources(game);
    processDebugLog(app, 'game-state', `Game ${gameId} ended. Status: ${status}`);
  }

  async function processGameResult(result: GameResult): Promise<void> {
    const gameDataService = app.gameDataService as GameDataService;
    const { mode, gameId } = result;
    if (mode === GameMode.PVB_AI || result.status === GameSessionStatus.CANCELLED_SERVER_ERROR) {
      await gameDataService.deleteAIGame(gameId);
    } else {
      await gameDataService.sendGameResult(result);
    }
  }

  return {
    startGame,
    pauseGame,
    resumeGame,
    endGame,
  };
}
