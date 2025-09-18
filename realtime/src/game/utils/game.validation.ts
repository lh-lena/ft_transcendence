import type { FastifyInstance } from 'fastify';
import { GameMode, GameSessionStatus } from '../../constants/game.constants.js';
import type { PausedGameState } from '../../websocket/types/network.types.js';
import type { GameSession } from '../../schemas/game.schema.js';
import { GameError } from '../../utils/game.error.js';
import type { GameSessionService, GameValidator } from '../types/game.js';
import type { User } from '../../schemas/user.schema.js';

export default function createGameValidator(app: FastifyInstance): GameValidator {
  const { log } = app;

  function validateResumingGame(
    pausedState: PausedGameState,
    game: GameSession,
    resumeByPlayerId?: number,
  ): void {
    const { gameId, status } = game;
    if (pausedState === undefined || pausedState.gameId !== gameId) {
      throw new GameError(`game ${gameId} is not paused or does not exist`);
    }
    validateGameStatus(status, [GameSessionStatus.PAUSED]);
    const allPlayersConnected = isPlayersConnected(game);
    if (!allPlayersConnected) {
      throw new GameError(`not all players are connected to the game ${gameId}`);
    }
    if (resumeByPlayerId != undefined && pausedState.pausedByPlayerId !== resumeByPlayerId) {
      throw new GameError(`game ${gameId} can be resumed only by player who paused it`);
    }
  }

  function isExpectedPlayer(players: User[], userId: number): boolean {
    const expectedPlayer = players.find((p) => p.userId === userId);
    if (expectedPlayer) {
      return true;
    }
    return false;
  }

  function validateGameStatus(
    status: GameSessionStatus,
    expectedStatuses: GameSessionStatus[],
  ): void {
    if (!expectedStatuses.includes(status)) {
      throw new GameError(`invalid game status. currently it is ${status}`);
    }
  }

  function getValidGameCheckPlayer(gameId: string, userId: number): GameSession {
    const gameSessionService = app.gameSessionService as GameSessionService;
    const game = gameSessionService.getGameSession(gameId) as GameSession;
    if (game === undefined || game === null) {
      throw new GameError(`game ${gameId} not found`);
    }
    if (!isExpectedPlayer(game.players, userId)) {
      throw new GameError(`you are not in game ${gameId}`);
    }
    return game;
  }

  function isPlayersConnected(game: GameSession): boolean {
    const { gameId } = game;
    app.log.debug(`[game-service] Checking players' connection status in game ${gameId}`);
    if (game.gameMode === GameMode.PVB_AI) {
      return game.isConnected.size === 1;
    }
    return game.isConnected.size === game.players.length;
  }

  function gameReadyToStart(game: GameSession): boolean {
    if (game.status === GameSessionStatus.ACTIVE) {
      log.debug(`[game-service] Game ${game.gameId} is already active`);
      return false;
    }

    if (game.status !== GameSessionStatus.PENDING && game.status !== GameSessionStatus.PAUSED) {
      log.debug(
        `[game-service] Game ${game.gameId} is in ${game.status} state and cannot be started`,
      );
      return false;
    }
    if (game.players.length < 1) {
      log.debug(`[game-service] Cannot start game ${game.gameId} - no players in the game`);
      return false;
    }
    if (game.gameMode === GameMode.PVP_REMOTE && game.players.length !== 2) {
      log.debug(
        `[game-service] Cannot start game ${game.gameId} - not enough players for remote game`,
      );
      return false;
    }
    if (!isPlayersConnected(game)) {
      log.debug(`[game-service] Cannot start game ${game.gameId} - players are not connected`);
      return false;
    }

    // if (game.gameLoopInterval !== undefined && game.gameLoopInterval !== null) {
    //   clearInterval(game.gameLoopInterval);
    //   game.gameLoopInterval = undefined;
    // }

    return true;
  }

  return {
    validateResumingGame,
    validateGameStatus,
    getValidGameCheckPlayer,
    isExpectedPlayer,
    isPlayersConnected,
    gameReadyToStart,
  };
}
