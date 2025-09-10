import type { FastifyInstance } from 'fastify';
import type {
  PlayerInput,
  User,
  GameSession,
  Player,
  UserIdType,
  GameIdType,
} from '../../schemas/index.js';
import { GameSessionStatus, NotificationType } from '../../constants/game.constants.js';
import { processGameError } from '../../utils/index.js';
import { GameError } from '../../utils/game.error.js';
import type { RespondService, ConnectionService } from '../../websocket/types/ws.types.js';
import type {
  GameSessionService,
  GameDataService,
  GameStateService,
  GameService,
} from '../types/game.js';
import createGameValidator from '../utils/game.validation.js';
import type { EnvironmentConfig } from '../../config/config.js';
import { addAIPlayerToGame } from '../utils/player.utils.js';

export default function createGameService(app: FastifyInstance): GameService {
  const { log } = app;
  const config = app.config as EnvironmentConfig;
  const validator = createGameValidator(app);

  async function handleStartGame(user: User, gameId: GameIdType): Promise<void> {
    const gameSessionService = app.gameSessionService as GameSessionService;
    const gameStateService = app.gameStateService as GameStateService;
    try {
      const existingGameSession = gameSessionService.getGameSession(gameId) as GameSession;
      let gameSession: GameSession;
      if (existingGameSession !== undefined && existingGameSession !== null) {
        gameSession = await joinGame(user, gameId, existingGameSession);
      } else {
        gameSession = await createGame(user, gameId);
      }
      if (validator.gameReadyToStart(gameSession)) {
        gameStateService.startGame(gameSession);
      }
    } catch (error: unknown) {
      const { userId } = user;
      processGameError(
        app,
        user,
        'game-service',
        `Failed to initialize game ID ${gameId} for user ID ${userId}: `,
        error,
      );
    }
  }

  async function createGame(user: User, gameId: GameIdType): Promise<GameSession> {
    const respond = app.respond as RespondService;
    const gameSessionService = app.gameSessionService as GameSessionService;
    const gameDataService = app.gameDataService as GameDataService;
    log.debug(`[game-service] Creating game ${gameId} for user ${user.userId}`);
    const backendGameData = await gameDataService.fetchGameData(gameId);
    if (!validator.isExpectedPlayer(backendGameData.players, user.userId)) {
      throw new GameError(`server failed to create game ${gameId}. you are not an expected player`);
    }
    addAIPlayerToGame(backendGameData);
    const gameSession = gameSessionService.createGameSession(
      gameId,
      backendGameData,
    ) as GameSession;
    gameSessionService.storeGameSession(gameSession);
    assignPlayerToGame(user.userId, gameId);
    gameSessionService.setPlayerConnectionStatus(user.userId, gameId, true);
    respond.notification(
      user.userId,
      NotificationType.INFO,
      `game ${gameId} created successfully. waiting for players to join...`,
    );
    log.debug(`[game-service] Game ${gameId} created successfully for user ${user.userId}`);
    return gameSession;
  }

  async function joinGame(
    user: User,
    gameId: GameIdType,
    existingGameSession: GameSession,
  ): Promise<GameSession> {
    const respond = app.respond as RespondService;
    const gameSessionService = app.gameSessionService as GameSessionService;
    const gameDataService = app.gameDataService as GameDataService;
    log.debug(`[game-service] Handling join user ${user.userId} to game ${gameId}`);
    const backendGameData = await gameDataService.fetchGameData(gameId);
    const isValidPlayer2 = validator.isExpectedPlayer(backendGameData.players, user.userId);
    if (!isValidPlayer2) {
      throw new GameError(`you are not an expected player for game ${gameId}`);
    }
    const isAlreadyInGame = existingGameSession.players.some((p) => p.userId === user.userId);
    if (isAlreadyInGame) {
      log.debug(`[game-service] User ${user.userId} already in game ${gameId}`);
      respond.notification(user.userId, NotificationType.INFO, `you are already in game ${gameId}`);
      assignPlayerToGame(user.userId, gameId);
      gameSessionService.setPlayerConnectionStatus(user.userId, gameId, true);
      respond.notificationToGame(
        gameId,
        NotificationType.INFO,
        `${user.userAlias} successfully joined game`,
        [user.userId],
      );
      return existingGameSession;
    }
    validator.isGameFull(existingGameSession);
    const player1InSession = existingGameSession.players[0];
    const player1InBackend = backendGameData.players.find(
      (p) => p.userId === player1InSession.userId,
    );

    if (!player1InBackend) {
      throw new GameError(`game session is invalid. please try creating a new game`);
    }

    const player2FromBackend = backendGameData.players.find((p) => p.userId === user.userId);
    if (!player2FromBackend) {
      throw new GameError(`player data not found in backend for game ${gameId}`);
    }

    existingGameSession.players.push(player2FromBackend as Player);
    assignPlayerToGame(user.userId, gameId);
    gameSessionService.setPlayerConnectionStatus(user.userId, gameId, true);
    respond.notificationToGame(
      gameId,
      NotificationType.INFO,
      `${user.userAlias} successfully joined game`,
      [user.userId],
    );
    log.debug(
      `[game-service] Player ${user.userId} ${user.userAlias} successfully joined game ${gameId}`,
    );
    return existingGameSession;
  }

  function handleGamePause(user: User, gameId: GameIdType): void {
    if (user === undefined || user === null) return;
    const respond = app.respond as RespondService;
    const gameStateService = app.gameStateService as GameStateService;
    const { userId } = user;
    log.debug(`[game-service] Handling game pause for user ${userId} in game ${gameId}`);
    try {
      const game = validator.getValidGameCheckPlayer(gameId, userId);
      validator.validateGameStatus(game.status, [GameSessionStatus.ACTIVE]);
      const isPaused = gameStateService.pauseGame(game, userId);
      if (isPaused === true) {
        respond.gamePaused(
          gameId,
          `game paused by user ${user.userAlias} for ${config.websocket.pauseTimeout / 1000}s`,
        );
      }
    } catch (error: unknown) {
      processGameError(
        app,
        user,
        'game-service',
        `failed to pause game ID ${gameId} for user ID ${userId}: `,
        error,
      );
    }
  }

  function handleGameResume(user: User, gameId: GameIdType): void {
    if (user === undefined || user === null) return;
    const respond = app.respond as RespondService;
    const gameStateService = app.gameStateService as GameStateService;
    const { userId } = user;
    log.debug(`[game-service] Handling game resume for user ${userId} in game ${gameId}`);
    try {
      const game = validator.getValidGameCheckPlayer(gameId, userId);
      gameStateService.resumeGame(game, userId);
      respond.notificationToGame(
        gameId,
        NotificationType.INFO,
        `game resumed successfully by user ${user.userAlias}`,
      );
    } catch (error: unknown) {
      processGameError(
        app,
        user,
        'game-service',
        `Failed to resume game for user ${user.userId}:`,
        error,
      );
    }
  }

  function handlePlayerInput(user: User, action: PlayerInput): void {
    if (user === undefined || user === null) return;
    const { userId } = user;
    try {
      const { gameId } = action;
      const game = validator.getValidGameCheckPlayer(gameId, userId);
      const player = game.players.find((p) => p.userId === userId);
      validator.validateGameStatus(game.status, [GameSessionStatus.ACTIVE]);
      if (player!.sequence !== undefined && action.sequence <= player!.sequence) {
        log.debug(
          `[game-service] Ignoring old sequence from player ${userId}: ${action.sequence} <= ${player!.sequence}`,
        );
        return;
      }
      applyPlayerInputToPaddle(game, userId, action);
      player!.sequence = action.sequence;
    } catch (error: unknown) {
      processGameError(
        app,
        user,
        'game-service',
        `Failed to handle player input for user ID ${userId}: `,
        error,
      );
    }
  }

  async function handleGameLeave(user: User, gameId: GameIdType): Promise<void> {
    const respond = app.respond as RespondService;
    const gameStateService = app.gameStateService as GameStateService;
    const { userId } = user;
    log.debug(`[game-service] Handling game leave for user ${userId} in game ${gameId}`);
    try {
      const currentGameId = extractGameIdForUser(user);
      if (currentGameId !== gameId) {
        throw new GameError(`you are not in game ${gameId}`);
      }
      const game = validator.getValidGameCheckPlayer(gameId, userId);
      validator.validateGameStatus(game.status, [
        GameSessionStatus.ACTIVE,
        GameSessionStatus.PAUSED,
        GameSessionStatus.PENDING,
      ]);
      if (game.status === GameSessionStatus.PENDING) {
        respond.notificationToGame(
          gameId,
          NotificationType.INFO,
          ` ${user.userAlias} left the game before it started`,
        );
        await gameStateService.endGame(game, GameSessionStatus.CANCELLED);
      } else {
        respond.notificationToGame(
          gameId,
          NotificationType.INFO,
          ` ${user.userAlias} left the game`,
        );
        await gameStateService.endGame(game, GameSessionStatus.CANCELLED, user.userId);
      }
    } catch (error: unknown) {
      processGameError(
        app,
        user,
        'game-service',
        `Failed to handle game leave for user ID ${userId}`,
        error,
      );
    }
  }

  function applyPlayerInputToPaddle(
    game: GameSession,
    userId: UserIdType,
    action: PlayerInput,
  ): void {
    const playerIndex = game.players.findIndex((p) => p.userId === userId);
    const isPlayerA = playerIndex === 0;
    const targetPaddle = isPlayerA ? game.gameState.paddleA : game.gameState.paddleB;
    targetPaddle.direction = action.direction;
  }

  function extractGameIdForUser(user: User): GameIdType {
    const connectionService = app.connectionService as ConnectionService;
    const userConnection = connectionService.getConnection(user.userId);
    if (
      userConnection === undefined ||
      userConnection.gameId === undefined ||
      userConnection.gameId === null
    ) {
      throw new GameError(`you are not connected to any game`);
    }
    return userConnection.gameId;
  }

  function assignPlayerToGame(userId: UserIdType, gameId: GameIdType): void {
    const connectionService = app.connectionService as ConnectionService;
    connectionService.updateUserGame(userId, gameId);
  }

  return {
    handleStartGame,
    handleGamePause,
    handleGameResume,
    handlePlayerInput,
    handleGameLeave,
  };
}
