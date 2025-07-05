import { FastifyInstance } from 'fastify';
import { GameMode, GameSessionStatus, NotificationType, PlayerInput } from '../types/game.types.js';
import { GameSession } from '../schemas/game.schema.js';
import { User } from '../schemas/user.schema.js';
import { GameError } from '../utils/game.error.js';
import { StartGame } from 'schemas/game.schema.js';

export default function createGameService(app: FastifyInstance) {

  async function handleStartGame(user: User, gameId: string) : Promise<void> {
    const { log, respond, gameSessionService } = app;
    try {
      const existingGameSession = gameSessionService.getGameSession(gameId) as GameSession;
      let gameSession: GameSession;
      if (existingGameSession) {
        gameSession = await joinGame(user, gameId, existingGameSession);
      } else {
        gameSession = await createGame(user, gameId);
      }
      if (gameReadyToStart(gameSession)) {
        await app.gameStateService.startGame(gameSession);
      }
    } catch (error) {
      const { userId } = user;
      if (error instanceof GameError) {
        log.debug(`[game-service] User ID ${userId}. Game ID ${gameId}. Error: ${error.message}`);
        respond.notification(userId, NotificationType.WARN, error.message);
      } else {
        const errorMsg = `Failed to initialize game ID ${gameId} for user ID ${user.userId}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        app.log.error(`[game-service] ${errorMsg}`);
        app.respond.error(user.userId, errorMsg);
      }
    }
  }

  async function createGame(user: User, gameId: string): Promise<GameSession> {
    app.log.debug(`[game-service] Creating game ${gameId} for user ${user.userId}`);
    const { log, respond, gameSessionService } = app;
    const backendGameData = await app.gameDataService.fetchGameData(gameId) as StartGame;
    if (!isExpectedPlayer(backendGameData.players, user.userId)) {
      throw new GameError(`server failed to create game ${gameId}. you are not an expected player`);
    }
    const gameSession = await app.gameSessionService.createGameSession(gameId, backendGameData);
    gameSessionService.storeGameSession(gameSession);
    assignPlayerToGame(user.userId, gameId);
    gameSessionService.setPlayerConnectionStatus(user.userId, gameId, true);
    respond.notification(user.userId, NotificationType.INFO, `game ${gameId} created successfully. waiting for players to join...`);
    log.debug(`[game-service] Game ${gameId} created successfully for user ${user.userId}`);
    return gameSession;
  }

    async function joinGame(user: User, gameId: string, existingGameSession: GameSession) : Promise<GameSession> {
    app.log.debug(`[game-service] Handling join user ${user.userId} to game ${gameId}`);
    const { log, respond, gameSessionService } = app;
    const backendGameData = await app.gameDataService.fetchGameData(gameId) as StartGame;
    const isValidPlayer2 = isExpectedPlayer(backendGameData.players, user.userId);
    if (!isValidPlayer2) {
      throw new GameError(`you are not an expected player for game ${gameId}`);
    }
    const isAlreadyInGame = existingGameSession.players.some(p => p.userId === user.userId);
    if (isAlreadyInGame) {
      log.debug(`[game-service] User ${user.userId} already in game ${gameId}`);
      respond.notification(user.userId, NotificationType.INFO, `you are already in game ${gameId}`);
      assignPlayerToGame(user.userId, gameId);
    gameSessionService.setPlayerConnectionStatus(user.userId, gameId, true);
    respond.notificationToGame(gameId, NotificationType.INFO, `${user.userAlias} successfully joined game`, [user.userId]);
      return existingGameSession;
    }
    if (existingGameSession.gameMode === GameMode.PVP_REMOTE && existingGameSession.players.length >= 2) {
      throw new GameError(`game ${gameId} is already full`);
    }
    const player1InSession = existingGameSession.players[0];
    const player1InBackend = backendGameData.players.find(p => p.userId === player1InSession.userId);

    if (!player1InBackend) {
      throw new GameError(`game session is invalid. please try creating a new game`);
    }

    const player2FromBackend = backendGameData.players.find(p => p.userId === user.userId);
    if (!player2FromBackend) {
      throw new GameError(`player data not found in backend for game ${gameId}`);
    }

    existingGameSession.players.push(player2FromBackend);
    assignPlayerToGame(user.userId, gameId);
    gameSessionService.setPlayerConnectionStatus(user.userId, gameId, true);
    respond.notificationToGame(gameId, NotificationType.INFO, `${user.userAlias} successfully joined game`, [user.userId]);
    log.debug(`[game-service] Player ${user.userId} ${user.userAlias} successfully joined game ${gameId}`);
    return existingGameSession;
  }

  function handleGamePause(user: User, gameId: string): void {
    const { userId } = user;
    const { log, respond, gameStateService } = app;
    app.log.debug(`[game-service] Handling game pause for user ${userId} in game ${gameId}`);
    try {
      const game = getValidGameCheckPlayer(gameId, userId);
      validateGameStatus(game.status, [GameSessionStatus.ACTIVE]);
      gameStateService.pauseGame(userId, game);
      respond.gamePaused(gameId, `game paused by user ${user.userAlias} for ${app.config.websocket.pauseTimeout/1000}s`);
    } catch (error) {
      if (error instanceof GameError) {
        log.debug(`[game-service] User ID ${userId}. Game ID ${gameId}. Error: ${error.message}`);
        respond.notification(userId, NotificationType.WARN, error.message);
      } else {
        const errorMsg = `Failed to pause game for user ${userId}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        log.error(`[game-service] ${errorMsg}`);
        respond.error(userId, errorMsg);
      }
    }
  }

  async function handleGameResume(user: User, gameId: string): Promise<void> {
    const { userId } = user;
    const { log, respond } = app;
    app.log.debug(`[game-service] Handling game resume for user ${userId} in game ${gameId}`);
    try {
      const game = getValidGameCheckPlayer(gameId, userId);
      validateGameStatus(game.status, [GameSessionStatus.PAUSED]);
      await app.gameStateService.resumeGame(userId, game);
      respond.notificationToGame(gameId, NotificationType.INFO, `game resumed successfully by user ${user.userAlias}`);
    } catch(error) {
      if (error instanceof GameError) {
        log.debug(`[game-service] User ID ${user.userId}. Game ID ${gameId}. Error: ${error.message}`);
        respond.notification(user.userId, NotificationType.WARN, error.message);
      } else {
        const errorMsg = `Failed to resume game for user ${user.userId}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        log.error(`[game-service] ${errorMsg}`);
        respond.error(user.userId, errorMsg);
      }
    }
  }

  function handlePlayerInput(user: User, action: PlayerInput): void {
    const { userId } = user;
    const { log, respond } = app;
    try {
      const gameId = extractGameIdForUser(user);
      const game = getValidGameCheckPlayer(gameId, userId);
      validateGameStatus(game.status, [GameSessionStatus.ACTIVE]);
      if (action.sequence <= game.lastSequence) {
        return;
      }
      applyPlayerInputToPaddle(game, userId, action);
      game.lastSequence = action.sequence;
    } catch (error) {
      if (error instanceof GameError) {
        log.debug(`[game-service] User ID ${userId}. Error: ${error.message}`);
        respond.notification(userId, NotificationType.WARN, error.message);
      } else {
        const errorMsg = `Failed to handle player's input for user ${userId}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        log.error(`[game-service] ${errorMsg}`);
        respond.error(userId, errorMsg);
      }
    }
  }

  function handleGameLeave(user: User, gameId: string): void {
    const { userId } = user;
    const { log, respond, gameStateService } = app;
    app.log.debug(`[game-service] Handling game leave for user ${userId} in game ${gameId}`);
    try {
      const currentGameId = extractGameIdForUser(user);
      if (currentGameId !== gameId) {
        throw new GameError(`you are not in game ${gameId}`);
      }
      const game = getValidGameCheckPlayer(gameId, userId);
      validateGameStatus(game.status, [GameSessionStatus.ACTIVE, GameSessionStatus.PAUSED, GameSessionStatus.PENDING]);
      if (game.status === GameSessionStatus.PENDING) {
        respond.notificationToGame(gameId, NotificationType.INFO, ` ${user.userAlias} left the game before it started`);
        gameStateService.endGame(game, GameSessionStatus.CANCELLED);
      } else {
        respond.notificationToGame(gameId, NotificationType.INFO, ` ${user.userAlias} left the game`);
        gameStateService.endGame(game, GameSessionStatus.CANCELLED, user.userId);
      }
      app.log.debug(`[game-service] Handling join game`);
      await joinPlayerToGame(gameId, user, gameSession);
      if (canStartGame(gameId)) {
        await startGame(gameId);
      }
    } catch (error) {
      if (error instanceof GameError) {
        log.debug(`[game-service] User ID ${userId}. Game ID ${gameId}. Error: ${error.message}`);
        respond.notification(userId, NotificationType.WARN, error.message);
      } else {
        const errorMsg = `Failed to handle game leave. User ID ${userId}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        log.error(`[game-service] ${errorMsg}`);
        respond.error(userId, errorMsg);
      }
    }
  }

  function getValidGameCheckPlayer(gameId: string, userId: number): GameSession {
    const game = app.gameSessionService.getGameSession(gameId) as GameSession;
    if (!game) {
      throw new GameError(`game ${gameId} not found`);
    }
    if (!isExpectedPlayer(game.players, userId)) {
      throw new GameError(`you are not in game ${gameId}`);
    }
    return game;
  }

  function validateGameStatus(status: GameSessionStatus, expectedStatuses: GameSessionStatus[]): void {
    if (!expectedStatuses.includes(status)) {
      throw new GameError(`invalid game status. currently it is ${status}`);
    }
  }

  function applyPlayerInputToPaddle(game: GameSession, userId: number, action: PlayerInput): void {
    const playerIndex = game.players.findIndex(p => p.userId === userId);
    const isPlayerA = playerIndex === 0;
    const targetPaddle = isPlayerA ? game.gameState.paddleA : game.gameState.paddleB;
    targetPaddle.direction = action.direction;
  }

  function isPlayersConnected(game: GameSession) : boolean {
    const { gameId } = game;
    app.log.debug(`[game-service] Checking players' connection status in game ${gameId}`);

    return game.isConnected.size === game.players.length;
  }

  function gameReadyToStart(game: GameSession) : boolean {
    if (game.status === GameSessionStatus.ACTIVE) {
      app.log.debug(`[game-service] Game ${game.gameId} is already active`);
      return false;
    }

    if (game.status !== GameSessionStatus.PENDING && game.status !== GameSessionStatus.PAUSED) {
      app.log.debug(`[game-service] Game ${game.gameId} is in ${game.status} state and cannot be started`);
      return false;
    }
    if (game.players.length < 1) {
      app.log.debug(`[game-service] Cannot start game ${game.gameId} - no players in the game`);
      return false;
    }
    if (game.gameMode === GameMode.PVP_REMOTE && game.players.length !== 2) {
      app.log.debug(`[game-service] Cannot start game ${game.gameId} - not enough players for remote game`);
      return false;
    }
    if (!isPlayersConnected(game)) {
      app.log.debug(`[game-service] Cannot start game ${game.gameId} - players are not connected`);
      return false;
    }

    // Stop game loop
    if (game.gameLoopInterval) {
      clearInterval(game.gameLoopInterval);
      game.gameLoopInterval = undefined;
    }

    return true;
  }

  function extractGameIdForUser(user: User): string {
    const userConnection = app.connectionService.getConnection(user.userId);
    if (!userConnection || !userConnection.gameId) {
      throw new GameError(`you are not connected to any game`);
    }
    return userConnection.gameId;
  }

  function isExpectedPlayer(players: User[], userId: number) : boolean {
    const expectedPlayer = players.find(p => p.userId === userId);
    if (expectedPlayer) {
      return true;
    }
    return false;
  }

  function assignPlayerToGame(userId: number, gameId: string): void {
    app.connectionService.updateUserGame(userId, gameId);
  }

  return {
    handleStartGame,
    handleGamePause,
    handleGameResume,
    handlePlayerInput,
    handleGameLeave,
    isPlayersConnected,
    gameReadyToStart,
    isExpectedPlayer,
    validateGameStatus,
    getValidGameCheckPlayer,
  }
}

export default createGameService;