import type { FastifyInstance } from 'fastify';
import type { User, GameResult, GameState, GameSession } from '../../schemas/index.js';
import type { PausedGameState } from '../../websocket/types/network.types.js';
import { PONG_CONFIG, NotificationType, GameSessionStatus } from '../../constants/index.js';
import { processErrorLog } from '../../utils/error.handler.js';
import {
  updateGame,
  checkWinCondition,
  resetGameState,
} from '../../game/engines/pong/pong.engine.js';
import createGameValidator from '../utils/game.validation.js';
import type { ConnectionService, RespondService } from '../../websocket/types/ws.types.js';
import type { GameSessionService, GameDataService, GameStateService } from '../types/game.js';
import type { EnvironmentConfig } from '../../config/config.js';
import { processDebugLog } from '../../utils/error.handler.js';

export default function createGameStateService(app: FastifyInstance): GameStateService {
  const pausedGames: Map<string, PausedGameState> = new Map();
  const pauseTimeouts: Map<string, NodeJS.Timeout> = new Map();
  const config = app.config as EnvironmentConfig;
  const validator = createGameValidator(app);
  const { log } = app;

  function startGame(game: GameSession): void {
    log.info(`[game-state] Starting the game ${game.gameId}`);
    updateGameToActive(game);
    resetGameState(game.gameState);
    broadcastGameUpdate(game.players, game.gameState);
    startCountdownSequence(game, 'Game started!', PONG_CONFIG.COUNTDOWN);
  }

  function pauseGame(game: GameSession, pausedByPlayerId: number): boolean {
    if (game === undefined || game === null) {
      log.warn(`[game-state] Cannot pause - game not found`);
      return false;
    }
    const respond = app.respond as RespondService;
    const { gameId, status } = game;
    if (status === GameSessionStatus.PAUSED) {
      log.debug(`[game-state] Game ${gameId} is already paused, skipping pause`);
      return false;
    }
    const existingPausedGame = pausedGames.get(gameId);
    if (
      existingPausedGame !== undefined &&
      existingPausedGame.playersWhoPaused.has(pausedByPlayerId)
    ) {
      log.debug(
        `[game-state] Player ${pausedByPlayerId} has already used their pause in game ${gameId}`,
      );
      respond.notification(
        pausedByPlayerId,
        NotificationType.WARN,
        `you have used your pause for this game`,
      );
      return false;
    }
    stopGameLoop(game);
    updateGameToPaused(game);
    storePausedGameInfo(game, pausedByPlayerId);
    setAutoResume(game);
    return true;
  }

  function resumeGame(game: GameSession, resumeByPlayerId?: number): void {
    if (game === undefined || game === null) {
      log.warn(`[game-state] Cannot resume - game not found`);
      return;
    }
    const { gameId } = game;
    const pausedState = pausedGames.get(gameId) as PausedGameState;
    validator.validateResumingGame(pausedState, game, resumeByPlayerId);
    stopAutoResume(gameId);
    updateGameToActive(game);
    broadcastGameUpdate(game.players, game.gameState);
    startCountdownSequence(game, 'Game resumed!', PONG_CONFIG.COUNTDOWN);
  }

  async function endGame(
    game: GameSession,
    status:
      | GameSessionStatus.CANCELLED
      | GameSessionStatus.FINISHED
      | GameSessionStatus.CANCELLED_SERVER_ERROR,
    leftPlayerId?: number,
  ): Promise<void> {
    if (game === undefined || game === null) {
      log.warn(`[game-state] Cannot end - game not found`);
      return;
    }
    const respond = app.respond as RespondService;
    const gameDataService = app.gameDataService as GameDataService;
    const { gameId } = game;
    log.debug(`[game-state] Ending game ${gameId} with status: ${status}`);
    stopCountdownSequence(game);
    stopGameLoop(game);
    updateGameToEnded(game, status);
    removePausedGameInfo(gameId); //added here
    const result = createGameResult(game, status, leftPlayerId);
    respond.gameEnded(gameId, result);
    await gameDataService.sendGameResult(result);
    cleanupGameResources(game);
    log.debug(
      `[game-state] Game ${gameId} ended. Status: ${status}. Result: ${JSON.stringify(result)}`,
    );
  }

  function startGameLoop(game: GameSession): void {
    if (game === undefined || game === null) {
      log.warn(`[game-state] Cannot start game loop - game not found`);
      return;
    }
    log.debug(`[game-state] Starting the game loop. Game ID ${game.gameId}`);
    if (game.gameLoopInterval !== undefined) {
      log.warn(`[game-state] Game loop already running for game ${game.gameId}`);
      return;
    }
    game.gameState.sequence = 1;
    const targetFrameTime = 1000 / PONG_CONFIG.FPS;
    let lastFrameTime = Date.now();
    game.gameLoopInterval = setInterval(() => {
      try {
        const currentTime = Date.now();
        let deltaTime = (currentTime - lastFrameTime) / 1000;
        deltaTime = Math.min(deltaTime, 0.033);
        lastFrameTime = currentTime;
        const { gameState } = game;
        if (game.status !== GameSessionStatus.ACTIVE) {
          stopGameLoop(game);
          return;
        }
        if (gameState.countdown <= 0) {
          updateGame(gameState, deltaTime);
        }
        if (checkWinCondition(gameState)) {
          endGame(game, GameSessionStatus.FINISHED).catch((error) => {
            processErrorLog(app, 'game-state', `Error ending game ${game.gameId}:`, error);
          });
          return;
        }
        game.gameState.sequence++;
        if (game.gameState.sequence % 2 === 0) {
          broadcastGameUpdate(game.players, gameState);
        }
      } catch (error: unknown) {
        processErrorLog(app, 'game-state', `Error in game loop for ${game.gameId}`, error);
        endGame(game, GameSessionStatus.CANCELLED_SERVER_ERROR).catch((error) => {
          processErrorLog(
            app,
            'game-state',
            `Error ending game ${game.gameId} due to server error:`,
            error,
          );
        });
      }
    }, targetFrameTime);
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
          `[game-state] Countdown interrupted for game ${game.gameId}. Status: ${game.status}`,
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
        startGameLoop(game);
      }
    }, 1300);
  }

  function stopCountdownSequence(game: GameSession): void {
    if (game === undefined || game === null) return;
    if (game.countdownInterval !== undefined) {
      clearInterval(game.countdownInterval);
      game.countdownInterval = undefined;
      log.info(
        `[game-state] Countdown stopped for game ${game.gameId} due to pause/leave/disconnect`,
      );
    }
  }

  function stopGameLoop(game: GameSession): void {
    if (game.gameLoopInterval !== undefined) {
      clearInterval(game.gameLoopInterval);
      game.gameLoopInterval = undefined;
    }
  }

  function createGameResult(
    game: GameSession,
    status: GameSessionStatus,
    leftPlayerId?: number,
  ): GameResult {
    let finishedAt = game.finishedAt;
    if (finishedAt === undefined || finishedAt === null) {
      finishedAt = Date.now().toString();
    }
    let player1Username = game.players[0]?.userAlias;
    if (player1Username === undefined || player1Username === null) {
      player1Username = 'Player 1';
    }
    let player2Username = game.players[1]?.userAlias;
    if (player2Username === undefined || player2Username === null) {
      player2Username = 'Player 2';
    }
    const baseResult: Partial<GameResult> = {
      gameId: game.gameId,
      scorePlayer1: game.gameState.paddleA.score,
      scorePlayer2: game.gameState.paddleB.score,
      player1Username: player1Username,
      player2Username: player2Username,
      mode: game.gameMode,
      startedAt: game.startedAt,
      finishedAt: finishedAt,
    };
    const winnerId =
      game.gameState.paddleA.score > game.gameState.paddleB.score
        ? game.players[0].userId
        : game.players[1].userId;
    const loserId =
      winnerId === game.players[0].userId ? game.players[1].userId : game.players[0].userId;
    const setLoserId: number | null = leftPlayerId !== undefined ? leftPlayerId : null;
    let setWinnerId: number | null = null;
    if (setLoserId !== null) {
      const winnerUser = game.players.find((player) => player.userId !== setLoserId);
      setWinnerId = winnerUser !== undefined ? winnerUser?.userId : null;
    }
    switch (status) {
      case GameSessionStatus.FINISHED:
        return {
          ...baseResult,
          status,
          winnerId,
          loserId,
        } as GameResult;

      case GameSessionStatus.CANCELLED:
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
    if (game === undefined || game === null) return;
    const gameSessionService = app.gameSessionService as GameSessionService;
    const startedAt = game.startedAt !== null ? game.startedAt : Date.now().toString();
    const { gameState } = game;
    gameState.status = GameSessionStatus.ACTIVE;
    gameState.countdown = PONG_CONFIG.COUNTDOWN;
    gameSessionService.updateGameSession(game.gameId, {
      startedAt,
      status: GameSessionStatus.ACTIVE,
    });
    log.debug(`[game-state] Game ${game.gameId} updated to ACTIVE status`);
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
    log.debug(`[game-state] Game ${game.gameId} updated to PAUSED status`);
  }

  function updateGameToEnded(game: GameSession, status: GameSessionStatus): void {
    const gameSessionService = app.gameSessionService as GameSessionService;
    const { gameState } = game;
    gameState.status = status;
    gameState.countdown = 0;
    gameSessionService.updateGameSession(game.gameId, {
      status,
      finishedAt: Date.now().toString(),
    });
    log.debug(`[game-state] Game ${game.gameId} updated to ENDED status: ${status}`);
  }

  function storePausedGameInfo(game: GameSession, pausedByPlayerId: number): void {
    const existingPausedGame = pausedGames.get(game.gameId);
    if (existingPausedGame) {
      existingPausedGame.pausedAt = Date.now();
      existingPausedGame.playersWhoPaused.add(pausedByPlayerId);
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

  function removePausedGameInfo(gameId: string): void {
    pausedGames.delete(gameId);
    stopAutoResume(gameId);
  }

  function stopAutoResume(gameId: string): void {
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
        log.info(
          `[game-state] Auto-resuming game ${gameId} after pause timeout ${config.websocket.pauseTimeout / 1000}s`,
        );
        pauseTimeouts.delete(gameId);
        resumeGame(game);
      } catch (error: unknown) {
        processDebugLog(app, 'game-state', `Cannot handle auto-resume for game ${gameId}:`, error);
      }
    }, config.websocket.pauseTimeout);
    pauseTimeouts.set(gameId, pauseTimeout);
  }

  function broadcastGameUpdate(players: User[], gameState: GameState): void {
    const respond = app.respond as RespondService;
    const { gameUpdate } = respond;
    if (players[0] !== undefined && players[0].userId !== -1) {
      gameUpdate(players[0].userId, {
        ...gameState,
        activePaddle: 'paddleA',
      });
    }
    if (players[1] !== undefined && players[1].userId !== -1) {
      gameUpdate(players[1].userId, {
        ...gameState,
        activePaddle: 'paddleB',
      });
    }
  }

  function cleanupGameResources(game: GameSession): void {
    const gameSessionService = app.gameSessionService as GameSessionService;
    const connectionService = app.connectionService as ConnectionService;
    if (game === undefined || game === null) {
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
        if (game.isConnected.get(player.userId) === true) {
          connectionService.updateUserGame(player.userId, null);
        }
      });
      gameSessionService.removeGameSession(gameId);
      pausedGames.delete(gameId);
      log.debug(`[game-state] Successfully cleaned up game ${gameId}`);
    } catch (error: unknown) {
      processErrorLog(app, 'game-state', `Error cleaning up game ${gameId}: `, error);
    }
  }

  return {
    startGame,
    pauseGame,
    resumeGame,
    endGame,
  };
}
