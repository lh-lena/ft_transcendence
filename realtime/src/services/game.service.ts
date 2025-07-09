import { FastifyInstance } from 'fastify';
import { GameInstance, GameMode, StartGame, GameState, GameSessionStatus, GameResult, User, PlayerInput } from '../types/pong.types.js';
import { ErrorCode } from 'types/error.types.js';
import { updatePlayerPaddle } from './pong-engine.service.js';

export default function createGameService(app: FastifyInstance) {
  const playerGameMap: Map<number, string> = new Map();

  function isPlayersConnected(gameId: string) : boolean {
    app.log.debug(`[game-service] Checking players' connection status in game ${gameId}`);
    const game = app.gameSessionService.getGameSession(gameId) as GameInstance;
    if (!game) {
      app.log.debug(`[game-service] Game ${gameId} not found`);
      return false;
    }

    if (game.gameMode !== GameMode.PVP_REMOTE && game.connectedPlayer1) {
      return true;
    } else if (game.connectedPlayer1 && game.connectedPlayer2) {
      return true;
    }
    return false;
  }

  function canStartGame(gameId: string) : boolean {
    const game = app.gameSessionService.getGameSession(gameId) as GameInstance;
    if (!game) {
      app.log.warn(`[game-service] Cannot check start conditions - game ${gameId} not found`);
      return false;
    }

    if (game.status === GameSessionStatus.ACTIVE) {
      app.log.debug(`[game-service] Game ${gameId} already active`);
      return false;
    }

    if (game.gameMode === GameMode.PVP_REMOTE && game.players.length !== 2) {
      app.log.debug(`[game-service] Cannot start PVP_REMOTE game ${gameId} - not enough players (${game.players.length}/2)`);
      return false;
    }

    return isPlayersConnected(gameId);
  }

  async function handleCreateGame(gameId: string, user: User) : Promise<void> {
    try {
      const gameSessionExist = app.gameSessionService.getGameSession(gameId) as GameInstance;
      if (gameSessionExist) {
        app.log.debug(`[game-service] Game ${gameId} exists. Initialized game joining`);
        await handleJoinGame(gameId, user);
        return;
      }
      // const gameData = await app.gameDataService.fetchGameData(gameId) as StartGame;
      const gameData: StartGame = {
        gameId,
        gameMode: GameMode.PVP_REMOTE,
        players: [user]
      }
      const gameSession = await app.gameSessionService.createGameSession(gameId, gameData);

      if (!isExpectedPlayer(gameData.players, user.userId)) {
        throw new Error(`User ${user.userId} is not an expected player for game ${gameId}`);
      }
      assignPlayerToGame(user.userId, gameId);
      app.gameSessionService.setPlayerConnectionStatus(user.userId, gameId, true);
      app.wsService.sendToConnection(user.userId, 
      {
        event: 'notification',
        payload: {
          gameId,
          message: `Game ${gameId} created successfully`,
          timestamp: Date.now()
        }
      });
      if (canStartGame(gameId)) {
        await app.gameStateService.startGame(gameId);
      }
      app.log.debug(`[game-service] Game created successfully ${gameId} for user ${user.userId}`);
    } catch (error) {
      app.log.error(`[game-service] Failed to create game ${gameId} for ${user.userId}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      app.wsService.sendToConnection(
        user.userId, 
        {
          event: 'error',
          payload: {
            error: `Failed to initialize game ${gameId}`
          }
        }
      );
    }
  }

  async function handleJoinGame(gameId: string, user: User) : Promise<void> {
    try {
      const gameSession = app.gameSessionService.getGameSession(gameId) as GameInstance;
      if (!gameSession) {
        app.log.debug(`[game-service] Cannot check start conditions - game ${gameId} not found. Initialized game creation`);
        await handleCreateGame(gameId, user);
        return;
      }
      app.log.debug(`[game-service] Handling join game`);
      await joinPlayerToGame(gameId, user, gameSession);
      app.wsService.sendToConnection(user.userId, {event: 'notification', payload: {gameId, message: `You joined game ${gameId}`, timestamp: Date.now()}});
      if (canStartGame(gameId)) {
        await app.gameStateService.startGame(gameId);
      }
    } catch (error) {
      app.log.error(`[game-service] Failed to initialize game ${gameId} for joining user ${user.userId}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      app.wsService.sendToConnection(
        user.userId, 
        {
          event: 'error',
          payload: {
            error: `Failed to initialize game ${gameId} for joining`,
          }
        }
      );
    }
  }

  async function joinPlayerToGame(gameId: string, user: User, gameSession: GameInstance): Promise<void> {
    if (!gameSession) {
      throw new Error(`Game session ${gameId} not found`);
    }

    if (isExpectedPlayer(gameSession.players, user.userId)) {
      app.gameSessionService.setPlayerConnectionStatus(user.userId, gameId, true);
      assignPlayerToGame(user.userId, gameId);
      return;
    }

    if (gameSession.status !== GameSessionStatus.PENDING) {
      throw new Error(`Game ${gameId} is not in a joinable state. Status: ${gameSession.status}`);
    }

    if (gameSession.players.length >= 2) {
      throw new Error(` Game ${gameId} is already full`);
    }

    // const gameData = await app.gameDataService.fetchGameData(gameId) as StartGame;
    const gameData: StartGame = {
      gameId,
      gameMode: GameMode.PVP_REMOTE,
      players: [user]
    }

    if (!isExpectedPlayer(gameData.players, user.userId)) {
      throw new Error(` User ${user.userId} is not an expected player for game ${gameId}`);
    }

    if (isExpectedPlayer(gameSession.players, user.userId)) {
      app.log.debug(`[game-service] User ${user.userId} is already in the game ${gameId}`);
      assignPlayerToGame(user.userId, gameId);
      app.gameSessionService.setPlayerConnectionStatus(user.userId, gameId, true);
      return;
    }

    app.log.debug(`[game-service] Adding player ${user.userId} to game ${gameId}`);
    const { players } = gameData;
    const newPlayer = players.find(p => p.userId === user.userId);
    if (!newPlayer) {
      throw new Error(`User ${user.userId} is not an expected player for game ${gameId}`);
    }
    gameSession.players.push(newPlayer);
    assignPlayerToGame(user.userId, gameId);
    app.gameSessionService.setPlayerConnectionStatus(user.userId, gameId, true);
    app.wsService.broadcastToGame(gameId, 
    {
      event: 'notification',
      payload: {
        gameId,
        message: `Player ${user.userId} successfully joined game ${gameId}`,
        timestamp: Date.now()
      }
    });
    app.log.debug(`[game-service] Player ${user.userId} ${user.userAlias} successfully joined game ${gameId}`);
  }

  async function handlePlayerInput(userId: number, action: PlayerInput): Promise<void> {
    try {
      const gameId = playerGameMap.get(userId);
      if (!gameId) {
        app.log.debug(`[game-service] The user ${userId} not in a game`);
        throw new Error(`You are not in game ${gameId}`);
      }
  
      const game = app.gameSessionService.getGameSession(gameId) as GameInstance;
      if (!game) {
        app.log.debug(`Game ${gameId} not found for user ${userId}`);
        throw new Error(`Game ${gameId} is not found`);
      }
  
      if (game.status !== GameSessionStatus.ACTIVE) {
        app.log.debug(`[game-service] Game ${gameId} is not active`);
        throw new Error(`Game ${gameId} is not active`);
      }
  
      if (!isExpectedPlayer(game.players, userId)) {
        app.log.debug(`[game-service] Player ${userId} not found in game ${gameId}`);
        throw new Error(`You are not in game ${gameId}`);
      }
  
      const playerIndex = game.players.findIndex(p => p.userId === userId);
      const isPlayerA = playerIndex === 0;
      const targetPaddle = isPlayerA ? game.gameState.paddleA : game.gameState.paddleB;
      targetPaddle.direction = action.direction;
    } catch (error) {
      app.log.error(`[game-service] Failed to handle user's input. User ID${userId}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      app.wsService.sendToConnection(
        userId,
        {
          event: 'error',
          payload: {
            error: `${error instanceof Error ? error.message : 'Invalid input'}`,
          }
        }
      );
    } 
  }

  function handleGameLeave(gameId: string, userId: number): void {
    app.log.debug(`[game-service] Handling game leave for user ${userId} in game ${gameId}`);
    try {
      const gameId = playerGameMap.get(userId);
      if (!gameId) {
        app.log.debug(`[game-service] The user ${userId} not in a game ${gameId}`);
        throw new Error(`You are not in game ${gameId}`);
      }
  
      const game = app.gameSessionService.getGameSession(gameId) as GameInstance;
      if (!game) {
        app.log.debug(`Game ${gameId} not found for user ${userId}`);
        throw new Error(`Game ${gameId} is not found`);
      }
  
      if (game.status !== GameSessionStatus.ACTIVE) {
        app.log.debug(`[game-service] Game ${gameId} is not active`);
        throw new Error(`Game ${gameId} is not active`);
      }
  
      if (!isExpectedPlayer(game.players, userId)) {
        app.log.debug(`[game-service] Player ${userId} not found in game ${gameId}`);
        throw new Error(`You are not in game ${gameId}`);
      }

      app.gameStateService.endGame(gameId, GameSessionStatus.CANCELLED, `User ${userId} left the game`);

    } catch (error) {
      app.log.error(`[game-service] Failed to handle user's input. User ID${userId}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      app.wsService.sendToConnection(
        userId,
        {
          event: 'error',
          payload: {
            error: `${error instanceof Error ? error.message : 'Invalid input'}`,
          }
        }
      );
    }
  }

  function isExpectedPlayer(players: User[], userId: number) : boolean {
    const expectedPlayer = players.find(p => p.userId === userId);
    if (expectedPlayer) {
      return true;
    }
    return false;
  }

  function assignPlayerToGame(userId: number, gameId: string): void {
    playerGameMap.set(userId, gameId);
    app.connectionService.updateUserGame(userId, gameId);
  }

  function removeGameForPlayer(userId: number): void {
    playerGameMap.delete(userId);
    app.connectionService.updateUserGame(userId, null);
  }

  return {
    canStartGame,
    handleCreateGame,
    isPlayersConnected,
    handleJoinGame,
    handlePlayerInput,
    removeGameForPlayer
  }
}
