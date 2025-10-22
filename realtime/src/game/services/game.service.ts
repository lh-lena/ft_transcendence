import type { FastifyInstance } from 'fastify';
import type {
  PlayerInput,
  User,
  GameSession,
  Player,
  UserIdType,
  GameIdType,
  StartGame,
  BackendStartGame,
} from '../../schemas/index.js';
import { GameSessionStatus, NotificationType } from '../../constants/index.js';
import { processDebugLog, processGameError, processErrorLog } from '../../utils/index.js';
import { GameError } from '../../utils/game.error.js';
import type { RespondService, ConnectionService } from '../../websocket/types/ws.types.js';
import type {
  GameSessionService,
  GameDataService,
  GameStateService,
  GameService,
} from '../types/game.types.js';
import createGameValidator from '../utils/game.validation.js';
import type { EnvironmentConfig } from '../../config/config.js';
import { addAIPlayerToGame, createPlayerFromUser, getUserDisplayName } from '../utils/player.utils.js';
import { AuthService } from '../../auth/auth.types.js';

export default function createGameService(app: FastifyInstance): GameService {
  const config = app.config as EnvironmentConfig;
  const validator = createGameValidator(app);
  const authService = app.auth as AuthService;

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

  async function handleStartGame(
    arg1: User | BackendStartGame,
    arg2?: GameIdType,
  ): Promise<boolean> {
    const gameDataService = app.gameDataService as GameDataService;
    const gameStateService = app.gameStateService as GameStateService;
    try {
      let backendGameData: BackendStartGame;
      if (arg2 !== undefined) {
        const gameId = arg2 as GameIdType;
        backendGameData = await gameDataService.fetchGameData(gameId);
      } else {
        backendGameData = arg1 as BackendStartGame;
      }
      const gameSession = await initializeGameSession(backendGameData);
      if (gameSession === null) return false;
      gameStateService.startGame(gameSession);
      return true;
    } catch (error: unknown) {
      processErrorLog(app, 'game-service', `Failed to initialize game session`, error);
      return false;
    }
  }

  async function initializeGameSession(data: BackendStartGame): Promise<GameSession | null> {
    const gameSessionService = app.gameSessionService as GameSessionService;
    if (data === undefined || data === null) return null;
    const gameStartData = await transformAndValidateGameData(data);
    if (gameStartData === null) return null;
    const gameSession = gameSessionService.createGameSession(
      data.gameId,
      gameStartData,
    ) as GameSession;
    addAIPlayerToGame(gameSession, data.mode, data.aiDifficulty);
    gameSessionService.storeGameSession(gameSession);
    syncUserConnectionStatus(gameStartData.players, data.gameId);
    return gameSession;
  }

  function syncUserConnectionStatus(players: Player[], gameId: GameIdType): void {
    const connectionService = app.connectionService as ConnectionService;
    const gameSessionService = app.gameSessionService as GameSessionService;

    for (const player of players) {
      if (player.isAI) continue;
      const connection = connectionService.getConnection(player.userId);
      if (connection === undefined) continue;
      gameSessionService.setPlayerConnectionStatus(player.userId, gameId, true);
      connectionService.updateUserGame(player.userId, gameId);
    }
  }

  async function transformAndValidateGameData(data: BackendStartGame): Promise<StartGame | null> {
    const players: Player[] = [];
    for (const player of data.players) {
      const userInfo = await authService.getUserInfo(player.userId);
      if (userInfo === null) return null;
      const newPlayer = createPlayerFromUser(userInfo, data.aiDifficulty);
      players.push(newPlayer);
    }
    const gameStartData: StartGame = {
      gameId: data.gameId,
      mode: data.mode,
      players: players,
      aiDifficulty: data.aiDifficulty,
    };
    return gameStartData;
  }

  function handleGamePause(user: User, gameId: GameIdType): void {
    if (user === undefined || user === null) return;
    const respond = app.respond as RespondService;
    const gameStateService = app.gameStateService as GameStateService;
    const { userId } = user;
    const name = getUserDisplayName(user);
    processDebugLog(
      app,
      'game-service',
      `Handling game pause for user ${userId} in game ${gameId}`,
    );
    try {
      const game = validator.getValidGameCheckPlayer(gameId, userId);
      validator.validateGameStatus(game.status, [GameSessionStatus.ACTIVE]);
      const isPaused = gameStateService.pauseGame(game, userId);
      if (isPaused === true) {
        respond.gamePaused(
          gameId,
          `game paused by user ${name} for ${config.websocket.pauseTimeout / 1000}s`,
        );
      }
    } catch (error: unknown) {
      processGameError(
        app,
        user,
        'game-service',
        `failed to pause game for user ${name}`,
        error,
      );
    }
  }

  function handleGameResume(user: User, gameId: GameIdType): void {
    if (user === undefined || user === null) return;
    const respond = app.respond as RespondService;
    const gameStateService = app.gameStateService as GameStateService;
    const { userId } = user;
    const name = getUserDisplayName(user);
    processDebugLog(
      app,
      'game-service',
      `Handling game resume for ${user.userId} in game ${gameId}`,
    );
    try {
      const game = validator.getValidGameCheckPlayer(gameId, userId);
      gameStateService.resumeGame(game, userId);
      respond.notificationToGame(
        gameId,
        NotificationType.INFO,
        `game resumed successfully by ${name}`,
        [user.userId]
      );
    } catch (error: unknown) {
      processGameError(
        app,
        user,
        'game-service',
        `Failed to resume game for ${name}:`,
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
        processDebugLog(
          app,
          'game-service',
          `Ignoring old sequence from player ${userId}: ${action.sequence} <= ${player!.sequence}`,
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
    const name = getUserDisplayName(user);
    processDebugLog(
      app,
      'game-service',
      `Handling game leave for user ${userId} in game ${gameId}`,
    );
    try {
      const currentGameId = extractGameIdForUser(user);
      if (currentGameId !== gameId) {
        throw new GameError(`you are not in the game`);
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
          ` ${name} left the game before it started`,
          [user.userId]
        );
        await gameStateService.endGame(game, GameSessionStatus.CANCELLED);
      } else {
        respond.notificationToGame(
          gameId, NotificationType.INFO, ` ${name} left the game`, [user.userId],
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

  return {
    handleStartGame,
    handleGamePause,
    handleGameResume,
    handlePlayerInput,
    handleGameLeave,
  };
}
