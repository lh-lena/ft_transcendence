import { FastifyInstance } from 'fastify';
import { GameInstance, GameMode, StartGame, GameState, GameSessionStatus, GameResult, User, PlayerInput } from '../types/pong.types.js';
import { PausedGameState } from 'types/network.types.js';

function createGameService(app: FastifyInstance) {
  const playerGameMap: Map<number, string> = new Map();
  const pausedGames: Map<string, PausedGameState> = new Map();

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

  async function startGame(gameId: string): Promise<void> {
    app.log.info(`[game-service] Starting the game ${gameId}`);
    const game = app.gameSessionService.getGameSession(gameId) as GameInstance;
    if (!game) {
      app.log.error(`[game-service] Failed to initialize game ${gameId}`);
      return;
    }
    if (game.status === GameSessionStatus.ACTIVE) {
      app.log.debug(`[game-service] Game ${gameId} is already active`);
      return;
    }

    if (!canStartGame(gameId)) {
      app.log.warn(`[game-service] Cannot start game ${gameId} - players not ready`);
      app.wsService.broadcastToGame(gameId, {
        event: 'error',
        payload: { error: 'All players must be connected to start the game' }
      });
      return;
      }

    const { gameState } = game;
    const usersId = game.players.map(p => p.userId).filter(id => id !== -1);
    const now = Date.now();

    game.lastUpdate = now;
    game.startedAt = now.toString();
    game.status = GameSessionStatus.ACTIVE;
    gameState.status = GameSessionStatus.ACTIVE;

    // TODO: gameLoop
    // game.gameLoopInterval = setInterval(() => updateGameLoop(gameId), 1000 / GAME_CONFIG.FPS);

    app.wsService.sendToConnections(usersId, {
      event: 'game_update',
      payload: gameState
    });
    app.log.info(`[game-service] Game started ${gameId} for ${game.players.map(p => p.userAlias).join(' vs ')} in mode ${game.gameMode}`);
  }

  function pauseGame(gameId: string, reason: string): void {
    app.log.info(`[game-service] Pausing game ${gameId} - Reason: ${reason}`);
    const game = app.gameSessionService.getGameSession(gameId) as GameInstance;
    if (!game) {
      app.log.warn(`[game-service] Cannot pause - game ${gameId} not found`);
      return;
    }

    if (game.status !== GameSessionStatus.ACTIVE) {
      app.log.debug(`[game-service] Game ${gameId} is not active. Game status: ${game.status}`);
      return;
    }

    // Stop game loop
    if (game.gameLoopInterval) {
      clearInterval(game.gameLoopInterval);
      game.gameLoopInterval = undefined;
    }

    game.status = GameSessionStatus.PAUSED;
    const pausedInfo: PausedGameState = {
      gameId,
      reason,
      pausedAt: Date.now(),
      players: game.players
    }
    pausedGames.set(game.gameId, pausedInfo);
    app.wsService.broadcastToGame(gameId, {
      event: 'game_pause',
      payload: { gameId, reason }
    });
    app.log.info(`[game-service] Game paused ${gameId} - Reason: ${reason}`);
  }

  function resumeGame(gameId: string): void {
    const game = app.gameSessionService.getGameSession(gameId) as GameInstance;
    const pausedState = pausedGames.get(gameId);
    
    if (!game) {
      app.log.error(`[game-service] Cannot resume - game ${gameId} not found`);
      return;
    }

    if (game.status !== GameSessionStatus.PAUSED) {
      app.log.warn(`[game-service] Cannot resume - game ${gameId} not paused. Status: ${game.status}`);
      return;
    }

    if (!pausedState) {
      app.log.warn(`[game-service] Cannot resume - game ${gameId} not paused. Status: ${game.status}`);
      return;
    }

    game.status = GameSessionStatus.ACTIVE;
    const {gameState } = game;
    // TODO: Restart game loop
    // game.gameLoopInterval = setInterval(() => updateGameLoop(gameId), 1000 / GAME_CONFIG.FPS);
    // set countdown to 3
    app.wsService.broadcastToGame(gameId, {
      event: 'game_update',
      payload: { gameState }
    });
    app.log.debug(`[game-service] Game resumed ${gameId}`);
  }

  function endGame(gameId: string, status: GameSessionStatus.CANCELLED | GameSessionStatus.FINISHED, reason: string) : void {
    app.log.debug(`[game-service] Ending game ${gameId}. Reason: ${reason}`);

    const game = app.gameSessionService.getGameSession(gameId) as GameInstance;
    if (!game) {
      app.log.warn(`[game-service] Cannot end - game ${gameId} not found`);
      return;
    }

    if (game.gameLoopInterval) {
      clearInterval(game.gameLoopInterval);
      game.gameLoopInterval = undefined;
    }

    game.finishedAt = Date.now().toString();
    game.status = status;
    game.gameState.status = status;

    const result : GameResult = {
      gameId,
      scorePlayer1: game.gameState.paddle1.score,
      scorePlayer2: game.gameState.paddle2.score,
      player1Username: game.players[0].userAlias,
      player2Username: game.players[1].userAlias,
      winnerId: game.gameState.paddle1.score > game.gameState.paddle2.score ? game.players[0].userId : game.players[1].userId,
      loserId: game.gameState.paddle1.score > game.gameState.paddle2.score ? game.players[1].userId : game.players[0].userId,
      status: game.status,
      startedAt: game.startedAt!,
      finishedAt: game.finishedAt
    };

    game.players.forEach(player => {
      if (player.userId !== -1) {
        playerGameMap.delete(player.userId);
        app.connectionService.updateUserGame(player.userId, null);
      }
    });

    const BACKEND_URL = app.config.websocket.backendUrl;
    fetch(`${BACKEND_URL}/api/games/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
    }).then(res => {
        if (!res.ok) app.log.error(`[game-service] Failed to send game result to backend: ${res.statusText}`);
        else {
          app.log.debug(`[game-service] Game ${gameId} result sent to backend`);
        }
    }).catch(error => {
        app.log.error(`[game-service] Error sending game result to backend:`, error);
    });

    app.wsService.broadcastToGame(gameId, {
      event: 'game_ended',
      payload: result
    });
    cleanup(gameId);
    app.log.debug(`[game-service] Game ended ${gameId}`);
  }

  async function handleCreateGame(gameId: string, user: User) : Promise<void> {
    try {
      // const gameData = await fetchGameData(gameId);
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
        await startGame(gameId);
      }
      app.log.debug(`[game-service] Game created successfully ${gameId} for user ${user.userId}`);
    } catch (error) {
      app.log.error(`[game-service] Failed to create game ${gameId} for ${user.userId}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      app.wsService.sendToConnection(
        user.userId, 
        {
          event: 'error',
          payload: {
            error: `Failed to initialize game ${gameId}`,
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
      if (canStartGame(gameId)) {
        await startGame(gameId);
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
      throw new Error(`Game ${gameId} is not in a joinable state (status: ${gameSession.status}).`);
    }

    if (gameSession.players.length >= 2) {
      throw new Error(` Game ${gameId} is already full`);
    }

    // const gameData = await fetchGameData(gameId);
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

  // TODO: 
  async function handlePalyerInput(userId: number, action: PlayerInput): Promise<void> {
    const gameId = playerGameMap.get(userId);
    if (!gameId) {
      app.log.debug(`[game-service] The user ${userId} not in a game`);
      return;
    }

    const game = app.gameSessionService.getGameSession(gameId) as GameInstance;
    if (!game) {
      app.log.debug(`Game ${gameId} not found for user ${userId}`);
      return;
    }

    if (game.status !== GameSessionStatus.ACTIVE) {
      app.log.debug(`[game-service] Game ${gameId} not active`);
      return;
    }

    const { players } = game;
    const player = players.find(p => p.userId === userId);
    if (!player) {
      app.log.debug(`Player ${userId} not found in game ${gameId}`);
      return;
    }

    // get game session
    // check game status if active
    // double check player in game session
    // update player input in struct
    // apply updates in game engine
  }

  async function fetchGameData(gameId: string): Promise<StartGame> {
    app.log.debug(`[game-service] Fetching game data for ${gameId} from backend`);
    
    const BACKEND_URL = app.config.websocket.backendUrl;
    const res = await fetch(`${BACKEND_URL}/api/game/:${gameId}`);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    app.log.debug(data, `[game-service] Fetched game data for ${gameId}:`);
    return data;
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


  function cleanup(gameId: string) : void {
    app.log.info(`[game-service] Scheduling cleanup for game ${gameId} in ${app.config.websocket.connectionTimeout}ms`);

    setTimeout(() => {
      app.log.info(`[game-service] Cleaning up game ${gameId}`);
      app.gameSessionService.removeGameSession(gameId);
      pausedGames.delete(gameId);
      app.log.debug(`[game-service] Game ${gameId} removed from sessions`);
    }, app.config.websocket.connectionTimeout);
  }


  return {
    canStartGame,
    handleCreateGame,
    isPlayersConnected,
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    handleJoinGame,
    cleanup
  }
}

export default createGameService;