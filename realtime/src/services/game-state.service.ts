import { FastifyInstance } from 'fastify';
import {
  GameSessionStatus,
  PONG_CONFIG,
  NotificationType,
  GameMode,
} from '../types/game.types.js';
import { PausedGameState } from '../types/network.types.js';
import { updateGame, checkWinCondition } from './pong-engine.service.js';
import { GameResult, GameState, GameSession } from '../schemas/game.schema.js';
import { User } from '../schemas/user.schema.js';
import { GameError } from '../utils/game.error.js';

export default function createGameStateService(app: FastifyInstance) {
  const pausedGames: Map<string, PausedGameState> = new Map();
  const pauseTimeouts = new Map<string, NodeJS.Timeout>();
  const config = app.config.websocket;

  function startGame(game: GameSession): void {
    app.log.info(`[game-state] Starting the game ${game.gameId}`);
    updateGameToActive(game);
    broadcastGameUpdate(game.players, game.gameState);
    startCountdownSequence(game, PONG_CONFIG.COUNTDOWN);
  }

  function pauseGame(pausedByPlayerId: number, game: GameSession): void {
    if (!game) {
      app.log.warn(`[game-state] Cannot pause - game not found`);
      return;
    }
    const { gameId } = game;
    stopGameLoop(game);
    if (pausedGames.has(gameId)) {
      app.log.warn(`[game-state] Game ${gameId} is already paused`);
      app.respond.notificationToGame(
        gameId,
        NotificationType.WARN,
        `game ${gameId} is already paused`,
      );
      return;
    }
    updateGameToPaused(game);
    storePausedGameInfo(game, pausedByPlayerId);
    setAutoResume(game, pausedByPlayerId);
    app.log.debug(
      `[game-state] Game ${gameId} paused for ${config.pauseTimeout / 1000}s`,
    );
  }

  async function resumeGame(
    resumeByPlayerId: number,
    game: GameSession,
  ): Promise<void> {
    if (!game) {
      app.log.warn(`[game-state] Cannot resume - game not found`);
      return;
    }
    const { gameId } = game;
    const pausedState = pausedGames.get(gameId) as PausedGameState;
    validateResumingGame(pausedState, game, resumeByPlayerId);
    removePausedGameInfo(gameId);
    updateGameToActive(game);
    broadcastGameUpdate(game.players, game.gameState);
    startCountdownSequence(game);
    app.log.debug(`[game-state] Game ID ${gameId} resumed`);
  }

  async function endGame(
    game: GameSession,
    status:
      | GameSessionStatus.CANCELLED
      | GameSessionStatus.FINISHED
      | GameSessionStatus.CANCELLED_SERVER_ERROR,
    leftPlayerId?: number,
  ): Promise<void> {
    if (!game) {
      app.log.warn(`[game-state] Cannot end - game not found`);
      return;
    }
    const { log, respond, gameDataService } = app;
    const { gameId } = game;
    log.debug(`[game-state] Ending game ${gameId} with status: ${status}`);
    stopCountdownSequence(game);
    updateGameToEnded(game, status);
    stopGameLoop(game);
    const result = createGameResult(game, status, leftPlayerId);
    respond.gameEnded(gameId, result);
    await gameDataService.sendGameResult(result);
    cleanupGameResources(game);
    log.debug(
      `[game-state] Game ${gameId} ended. Status: ${status}. Result: ${JSON.stringify(result)}`,
    );
  }

  function startGameLoop(game: GameSession): void {
    app.log.debug(
      `[game-state] Starting the game loop. Game ID ${game.gameId}`,
    );
    if (game.gameLoopInterval) {
      app.log.warn(
        `[game-state] Game loop already running for game ${game.gameId}`,
      );
      return;
    }
    game.gameState.sequence = 1;
    const targetFrameTime = 1000 / PONG_CONFIG.FPS;
    game.gameLoopInterval = setInterval(() => {
      try {
        const { gameState } = game;
        if (game.status !== GameSessionStatus.ACTIVE) {
          stopGameLoop(game);
          return;
        }
        if (gameState.countdown <= 0) {
          updateGame(gameState, targetFrameTime / 1000);
        }
        if (checkWinCondition(gameState)) {
          endGame(game, GameSessionStatus.FINISHED);
          return;
        }
        game.gameState.sequence++;
        if (game.gameState.sequence % 2 === 0) {
          broadcastGameUpdate(game.players, gameState);
        }
      } catch (error) {
        app.log.error(
          `[game-state-service] Error in game loop for ${game.gameId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        endGame(game, GameSessionStatus.CANCELLED_SERVER_ERROR);
      }
    }, targetFrameTime);
  }

  function startCountdownSequence(game: GameSession, count: number = 3): void {
    if (game.countdownInterval) {
      clearInterval(game.countdownInterval);
    }

    game.gameState.countdown = count;
    app.respond.countdownUpdate(
      game.gameId,
      count,
      count === 0 ? 'GO!' : count.toString(),
    );

    game.countdownInterval = setInterval(() => {
      if (game.status !== GameSessionStatus.ACTIVE) {
        clearInterval(game.countdownInterval);
        game.countdownInterval = undefined;
        app.log.info(
          `[game-state] Countdown interrupted for game ${game.gameId}. Status: ${game.status}`,
        );
        return;
      }

      count--;
      game.gameState.countdown = count;
      const message = count === 0 ? 'GO!' : count.toString();
      app.respond.countdownUpdate(game.gameId, count, message);

      if (count === 0) {
        clearInterval(game.countdownInterval);
        game.countdownInterval = undefined;
        app.respond.notificationToGame(
          game.gameId,
          NotificationType.INFO,
          'Game started!',
        );
        startGameLoop(game);
      }
    }, 1300);
  }

  function stopCountdownSequence(game: GameSession): void {
    if (game.countdownInterval) {
      clearInterval(game.countdownInterval);
      game.countdownInterval = undefined;
      app.log.info(
        `[game-state] Countdown stopped for game ${game.gameId} due to pause/leave/disconnect`,
      );
    }
  }

  function stopGameLoop(game: GameSession): void {
    if (game.gameLoopInterval) {
      clearInterval(game.gameLoopInterval);
      game.gameLoopInterval = undefined;
    }
  }

  function createGameResult(
    game: GameSession,
    status: GameSessionStatus,
    leftPlayerId?: number,
  ): GameResult {
    const baseResult: Partial<GameResult> = {
      gameId: game.gameId,
      scorePlayer1: game.gameState.paddleA.score,
      scorePlayer2: game.gameState.paddleB.score,
      player1Username: game.players[0]?.userAlias || 'Player 1',
      player2Username: game.players[1]?.userAlias || 'Player 2',
      mode: game.gameMode,
      startedAt: game.startedAt!,
      finishedAt: game.finishedAt || Date.now().toString(),
    };
    switch (status) {
      case GameSessionStatus.FINISHED:
        const winnerId =
          game.gameState.paddleA.score > game.gameState.paddleB.score
            ? game.players[0].userId
            : game.players[1].userId;
        const loserId =
          winnerId === game.players[0].userId
            ? game.players[1].userId
            : game.players[0].userId;
        return {
          ...baseResult,
          status,
          winnerId,
          loserId,
        } as GameResult;

      case GameSessionStatus.CANCELLED:
        const setLoserId: number | null =
          leftPlayerId !== undefined ? leftPlayerId : null;
        let setWinnerId: number | null = null;
        if (setLoserId !== null) {
          const winnerUser = game.players.find(
            (player) => player.userId !== setLoserId,
          );
          setWinnerId = winnerUser?.userId || null;
        }
        return {
          ...baseResult,
          status,
          winnerId: setWinnerId,
          loserId: setLoserId,
        } as GameResult;
      case GameSessionStatus.CANCELLED_SERVER_ERROR:
        return {
          ...baseResult,
          status,
          winnerId: null,
          loserId: null,
        } as GameResult;

      default:
        throw new Error(`invalid game status: ${status}`);
    }
  }

  function updateGameToActive(game: GameSession): void {
    const startedAt =
      game.startedAt !== null ? game.startedAt : Date.now().toString();
    const { gameState } = game;
    gameState.status = GameSessionStatus.ACTIVE;
    gameState.countdown = PONG_CONFIG.COUNTDOWN;
    app.gameSessionService.updateGameSession(game.gameId, {
      startedAt,
      status: GameSessionStatus.ACTIVE,
    });
  }

  function updateGameToPaused(game: GameSession): void {
    const { gameState } = game;
    gameState.status = GameSessionStatus.PAUSED;
    gameState.countdown = 0;
    app.gameSessionService.updateGameSession(game.gameId, {
      status: GameSessionStatus.PAUSED,
    });
  }

  function updateGameToEnded(
    game: GameSession,
    status: GameSessionStatus,
  ): void {
    app.log.debug(
      `[game-state] Updating game ${game.gameId} to status: ${status}`,
    );
    const { gameState } = game;
    gameState.status = status;
    gameState.countdown = 0;
    app.gameSessionService.updateGameSession(game.gameId, {
      status,
      finishedAt: Date.now().toString(),
    });
  }

  function storePausedGameInfo(
    game: GameSession,
    pausedByPlayerId: number,
  ): void {
    const pausedInfo: PausedGameState = {
      gameId: game.gameId,
      pausedByPlayerId,
      pausedAt: Date.now(),
      players: game.players,
    };
    pausedGames.set(game.gameId, pausedInfo);
  }

  function removePausedGameInfo(gameId: string): void {
    pausedGames.delete(gameId);

    const existingTimeout = pauseTimeouts.get(gameId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      pauseTimeouts.delete(gameId);
    }
  }

  function setAutoResume(game: GameSession, pausedByPlayerId: number): void {
    const { gameId } = game;
    const pauseTimeout = setTimeout(() => {
      app.log.info(
        `[game-state] Auto-resuming game ${gameId} after pause timeout ${config.pauseTimeout / 1000}s`,
      );
      pauseTimeouts.delete(gameId);
      resumeGame(pausedByPlayerId, game).catch((error) => {
        app.log.debug(
          `[game-state] Error during auto-resume for game ${gameId}: ${error instanceof GameError ? error.message : 'Unknown error'}`,
        );
        endGame(game, GameSessionStatus.CANCELLED_SERVER_ERROR);
      });
    }, config.pauseTimeout);
    pauseTimeouts.set(gameId, pauseTimeout);
  }

  function validateResumingGame(
    pausedState: PausedGameState,
    game: GameSession,
    resumeByPlayerId: number,
  ): void {
    const { gameId } = game;
    if (!pausedState || pausedState.gameId !== gameId) {
      throw new GameError(`game ${gameId} is not paused or does not exist`);
    }
    if (pausedState.pausedByPlayerId !== resumeByPlayerId) {
      throw new GameError(
        `game ${gameId} can be resumed only by player who paused it`,
      );
    }
    if (game.gameMode === GameMode.PVP_REMOTE && game.isConnected.size !== 2) {
      throw new GameError(
        `not all players are connected to the game ${gameId}`,
      );
    }
  }

  function broadcastGameUpdate(players: User[], gameState: GameState): void {
    const { gameUpdate } = app.respond;
    gameUpdate(players[0].userId, {
      ...gameState,
      activePaddle: 'paddleA',
    });
    if (players[1] && players[1].userId !== -1) {
      gameUpdate(players[1].userId, {
        ...gameState,
        activePaddle: 'paddleB',
      });
    }
  }

  function cleanupGameResources(game: GameSession): void {
    const { log, gameSessionService, connectionService } = app;
    if (!game) {
      log.warn(`[game-state] Game not found during cleanup`);
      return;
    }
    const { gameId } = game;
    log.debug(`[game-state] Cleaning up resources for game ${gameId}`);
    try {
      const pauseTimeout = pauseTimeouts.get(gameId);
      if (pauseTimeout) {
        clearTimeout(pauseTimeout);
        pauseTimeouts.delete(gameId);
      }
      game.players.forEach((player) => {
        if (game.isConnected.get(player.userId)) {
          connectionService.updateUserGame(player.userId, null);
        }
      });
      gameSessionService.removeGameSession(gameId);
      pausedGames.delete(gameId);
      log.debug(`[game-state] Successfully cleaned up game ${gameId}`);
    } catch (error) {
      log.error(`[game-state] Error cleaning up game ${gameId}`);
    }
  }

  return {
    startGame,
    pauseGame,
    resumeGame,
    endGame,
  };
}
