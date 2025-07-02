import { FastifyInstance } from 'fastify';
import { GameInstance, GameMode, StartGame, GameState, GameSessionStatus, GameResult, User } from '../types/pong.types.js';
import { initializeGameState } from '../pong-core/pong.service.js'
import { PausedGameState } from 'types/network.types.js';

export function createGameService(app: FastifyInstance) {
  const gameSessions: Map<string, GameInstance> = new Map();
  const pausedGames: Map<string, PausedGameState> = new Map();
  const playerGameMap: Map<number, string> = new Map();

  function getGameSession(gameId: string) : GameInstance | undefined {
    const session = gameSessions.get(gameId);
    app.log.debug(`[game-service] Getting game session ${gameId}: ${session ? 'found' : 'not found'}`);
    return session;
  }

  function isPlayersConnected(gameId: string) : boolean {
    app.log.debug(`[game-service] Check players' connection status in game ${gameId}`);
    const game = gameSessions.get(gameId);
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
      app.log.error({ gameId, error }, 'Error fetching initial game data from backend');
      return null;
    }
  }

  async function initializeGameSession(gameId: string, startGameData?: StartGame): Promise<GameInstance | undefined> {
    if (gameSessions.has(gameId)) {
      const existing = gameSessions.get(gameId);
      app.log.debug(`[game-service] Game session ${gameId} already exists, using existing instance`);
      return existing;
    }
    app.log.debug(`[game-service] Initializing game session ${gameId}`);

    let data: StartGame | null = null;;
    if (startGameData) {
      data = startGameData;
      app.log.debug(`[game-service] Using provided game data for ${gameId}`);
    } else {
      try {
        data = await fetchInitialGameData(gameId);
        if (!data) {
          app.log.warn(`[game-service] No game data fetched for ${gameId}`);
          app.wsService.broadcastToGame(gameId, {
            event: 'error',
            payload: { 'error': `Game not found or invalid: ${gameId}` }
          });
          return undefined;
        }
      } catch (error) {
        app.log.error(`[game-service] Failed to fetch game data for ${gameId}:`, error);
        app.wsService.broadcastToGame(gameId, {
          event: 'error',
          payload: {
            'error': `Failed to fetch game data for game: ${gameId}`
          }
        });
        return undefined;
      }
    }

    if (data.gameId !== gameId) {
      app.log.error(`[game-service] Game ID mismatch: expected ${gameId}, got ${data.gameId}`);
      app.wsService.broadcastToGame(gameId, {
        event: 'error',
        payload: {
          'error': `Invalid game data for game: ${gameId}`
        }
      });
      return undefined;
    }

    const newGame: GameInstance = {
      ...data,
      gameState: initializeGameState(gameId),
      status: GameSessionStatus.PENDING,
      gameLoopInterval: undefined,
      lastUpdate: Date.now(),
      startedAt: null,
      finishedAt: null,
    };

    app.connectionService.updateUserGame(newGame.players[0].userId, gameId);
    if (data.gameMode === GameMode.PVP_REMOTE && data.players[1] && data.players[1].userId !== -1) {
      app.connectionService.updateUserGame(newGame.players[1].userId, gameId);
    }
    app.log.debug(`[game-service] Game session initialized: ${gameId} for players: ${newGame.players.map(p => p.userAlias).join(' vs ')} in mode ${newGame.gameMode}`);
    return newGame;
  }

  function canStartGame(gameId: string) : boolean {
    const game = gameSessions.get(gameId);
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
    const game = gameSessions.get(gameId);
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
    const game = gameSessions.get(gameId);
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
    const game = gameSessions.get(gameId);
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

    const game = gameSessions.get(gameId);
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
    const gameData: StartGame = {
      gameId,
      gameMode: GameMode.PVP_REMOTE,
      players: [user]
    } // tmp

    const game = await initializeGameSession(gameId, gameData);
    if (!game) {
      app.log.error(`[game-service] Failed to initialize game ${gameId}`);
      return;
    }
    gameSessions.set(game.gameId, game);
    playerGameMap.set(user.userId, gameId);
    app.connectionService.updateUserGame(user.userId, gameId);
    if (canStartGame(gameId)) {
      await startGame(gameId);
    }
  }

  async function handleJoinGame(gameId: string, user: User) : Promise<void> {
    const game = gameSessions.get(gameId);
    if (!game) {
      app.log.debug(`[game-service] Cannot check start conditions - game ${gameId} not found`);
      try {
        await handleCreateGame(gameId, user);
        return;
      } catch (error) {
          app.log.error(`Failed to initialize game ${gameId} for joining user ${user.userId}:`, error);
          return;
      }
    }

    gameSessions.set(game.gameId, game);
    playerGameMap.set(user.userId, gameId);
    app.connectionService.updateUserGame(user.userId, gameId);
    if (canStartGame(gameId)) {
      await startGame(gameId);
    }
  }

  function cleanup(gameId: string) : void {
    app.log.info(`[game-service] Scheduling cleanup for game ${gameId} in ${app.config.websocket.connectionTimeout}ms`);

    setTimeout(() => {
      app.log.info(`[game-service] Cleaning up game ${gameId}`);
      gameSessions.delete(gameId);
      pausedGames.delete(gameId);
      app.log.debug(`[game-service] Game ${gameId} removed from sessions`);
    }, app.config.websocket.connectionTimeout);
  }


  return {
    getGameSession,
    canStartGame,
    initializeGameSession,
    handleCreateGame,
    fetchInitialGameData,
    isPlayersConnected,
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    handleJoinGame,
    cleanup
  };
}
