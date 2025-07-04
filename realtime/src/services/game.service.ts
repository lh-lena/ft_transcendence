import { FastifyInstance } from 'fastify';
import { GameInstance, GameMode, StartGame, GameState, GameSessionStatus, GameResult, User, PlayerInput } from '../types/pong.types.js';
import { PausedGameState } from 'types/network.types.js';

function createGameService(app: FastifyInstance) {
  const playerGameMap: Map<number, string> = new Map();
  const pausedGames: Map<string, PausedGameState> = new Map();

  function isPlayersConnected(gameId: string) : boolean {
    app.log.debug(`[game-service] Check players' connection status in game ${gameId}`);
    const game = app.gameSessionService.getGameSession(gameId);
    if (!game) {
      app.log.debug(`[game-service] Game ${gameId} not found`);
      return false;
    }

    const player1 = app.connectionService.getConnection(game.players[0].userId);

    if (game.gameMode !== GameMode.PVP_REMOTE && player1) {
      return true;
    } else if (player1 && game.players[1] && app.connectionService.getConnection(game.players[1].userId)) {
      return true;
    }
    return false;
  }

  function canStartGame(gameId: string) : boolean {
    const game = app.gameSessionService.getGameSession(gameId);
    if (!game) {
      app.log.warn(`[game-service] Cannot check start conditions - game ${gameId} not found`);
      return false;
    }

    if (game.status === GameSessionStatus.ACTIVE) {
      app.log.debug(`[game-service] Game ${gameId} already active`);
      return false;
    }

    if (game.gameMode === GameMode.PVP_REMOTE && game.players.length !== 2) {
      app.log.warn(`[game-service] Cannot start PVP_REMOTE game ${gameId} - not enough players (${game.players.length}/2)`);
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
    const game = app.gameSessionService.getGameSession(gameId);
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
    const game = app.gameSessionService.getGameSession(gameId);
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
    app.log.debug(`[game-service] Game ended ${gameId}`)
  }

  async function handleCreateGame(gameId: string, user: User) : Promise<void> {
    try {
      const gameData = fetchInitialGameData(gameId);
      const game = await app.gameSessionService.createGameSession(gameId, gameData);
      assignPlayerToGame(user.userId, gameId);
      if (canStartGame(gameId)) {
        await startGame(gameId);
      }
      app.log.debug(`[game-service] Game created successfully ${gameId} for user ${user.userId}`);
    } catch (error) {
      app.log.error(`[game-service] Failed to create game ${gameId} for ${user.userId}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async function handleJoinGame(gameId: string, user: User) : Promise<void> {
    try {
      const game = app.gameSessionService.getGameSessions(gameId);
        if (!game) {
        app.log.debug(`[game-service] Cannot check start conditions - game ${gameId} not found. Initialized game creation...`);
        await handleCreateGame(gameId, user);
        return;
      }
    } catch (error) {
        app.log.error(`[game-service] Failed to initialize game ${gameId} for joining user ${user.userId}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
    }

    assignPlayerToGame(user.userId, gameId);
    if (canStartGame(gameId)) {
      await startGame(gameId);
    }
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

  async function fetchInitialGameData(gameId: string): Promise<StartGame | null> {
    app.log.debug(`[game-service] Fetching game data for ${gameId} from backend`);
    try {
      const BACKEND_URL = app.config.websocket.backendUrl;
      const res = await fetch(`${BACKEND_URL}/api/game/:${gameId}`);

      if (!res.ok) return null;

      const data = await res.json();
      app.log.debug(`[game-service] Fetched game data for ${gameId}:`, data);
      return data;
    } catch (error) {
      app.log.error(`Error fetching initial game data from backend id: ${gameId}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
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