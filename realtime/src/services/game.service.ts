import { FastifyInstance } from 'fastify';
import { GameInstance, GameMode, StartGame, GameState, GameSessionStatus, User } from '../types/pong.types.js';
import { initializeGameState } from '../pong-core/pong.service.js'
import { PausedGameState } from 'types/network.types.js';

export function createGameService(app: FastifyInstance) {
  const gameSessions: Map<string, GameInstance> = new Map();
  const playerInGame: Map<number, string> = new Map();
  const pausedGames: Map<string, PausedGameState> = new Map();

  function getGameSession(gameId: string) : GameInstance | undefined {
    const session = gameSessions.get(gameId);
    app.log.debug(`[game-service] Getting game session ${gameId}: ${session ? 'found' : 'not found'}`);
    return session;
  }

  function getActiveGameId(userId: number): string | undefined {
    const gameId = playerInGame.get(userId);
    app.log.debug(`[game-service] Getting active game for user ${userId}: ${gameId || 'none'}`);
    return gameId;
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

  async function fetchStartGameData(gameId: string): Promise<any> {
    app.log.debug(`[game-service] Fetching game data for ${gameId} from backend`);
    const BACKEND_URL = app.config.websocket.backendUrl;
    const res = await fetch(`${BACKEND_URL}/api/game/:${gameId}`);

    if (!res.ok) return {};

    const data = await res.json();
    app.log.debug(`[game-service] Fetched game data for ${gameId}:`, data);
    return data;
  }

  async function initializeGameSession(gameId: string, startGameData?: StartGame): Promise<GameInstance | undefined> {
    if (gameSessions.has(gameId)) {
      app.log.warn(`[game-service] Game session ${gameId} already exists`);
      return gameSessions.get(gameId);
    }
    app.log.debug(`[game-service] Initializing game session ${gameId}`);

    let data: StartGame | null;
    if (startGameData) {
      data = startGameData;
      app.log.debug(`[game-service] Using provided game data for ${gameId}`);
    } else {
      try {
        data = await fetchStartGameData(gameId);
      } catch (error) {
        app.log.error(`[game-service] Failed to fetch game data for ${gameId}:`, error);
        app.wsService.broadcastToGame(gameId, {
          event: 'error',
          payload: {
            'error': `Failed to fetch game data for gameId: ${gameId}`
          }
        });
      }
      return undefined;
    }

    if (data.gameId !== gameId) {
      app.log.error(`[game-service] Game ID mismatch: expected ${gameId}, got ${data.gameId}`);
      app.wsService.broadcastToGame(gameId, {
        event: 'error',
        payload: {
          'error': `Invalid game data for gameId: ${gameId}`
        }
      });
      return undefined;
    }

    const initGameState: GameState = initializeGameState(gameId);
    const newGame: GameInstance = {
      ...data,
      gameState: initGameState,
      status: GameSessionStatus.PENDING,
      gameLoopInterval: undefined,
      lastUpdate: Date.now(),
      startedAt: Date.now().toString(),
      finishedAt: null,
    };

    gameSessions.set(gameId, newGame);
    app.connectionService.updateUserGame(newGame.players[0].userId, gameId);
    playerInGame.set(newGame.players[0].userId, gameId);
    if (data.gameMode === GameMode.PVP_REMOTE && data.players[1] && data.players[1].userId !== -1) {
      playerInGame.set(data.players[1].userId, gameId);
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

    return isPlayersConnected(gameId);
  }

  async function startGame(gameId: string): Promise<void> {
    app.log.info(`[game-service] Starting the game ${gameId}`);
    const game = await initializeGameSession(gameId, undefined);
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

    game.status = GameSessionStatus.ACTIVE;
    game.lastUpdate = Date.now();

    // TODO: gameLoop
    // game.gameLoopInterval = setInterval(() => updateGameLoop(gameId), 1000 / GAME_CONFIG.FPS);

    const { gameState } = game;

    const usersId = game.players.map(p => p.userId).filter(id => id !== -1);

    app.wsService.sendToConnections(usersId, {
      event: 'game_started',
      payload: { gameId, status: game.status }
    });

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

    if (game.status === GameSessionStatus.PAUSED) {
      app.log.debug(`[game-service] Game ${gameId} already paused`);
      return;
    }

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

    app.log.info(`[game-service] Resuming game ${gameId}`);
    game.status = GameSessionStatus.ACTIVE;

    // or just game_update event setting countdown
    const event = 'game_resume';
    const payload = { gameId };
    app.wsService.broadcastToGame(gameId, { event, payload });
  }

  function endGame(gameId: string, reason: string) : void {
    if (!gameId) return;
    app.log.info(`[game-service] Ending game ${gameId} - Reason: ${reason}`);
  }

  function cleanup(gameId: string) : void {
    app.log.info(`[game-service] Scheduling cleanup for game ${gameId} in ${app.config.websocket.connectionTimeout}ms`);

    setTimeout(() => {
      app.log.info(`[game-service] Cleaning up game ${gameId}`);
      gameSessions.delete(gameId);
      pausedGames.delete(gameId);
      app.log.debug(`[game-service] Game ${gameId} removed from memory`);
    }, app.config.websocket.connectionTimeout);
  }


  return {
    getGameSession,
    getActiveGameId,
    canStartGame,
    initializeGameSession,
    fetchStartGameData,
    isPlayersConnected,
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    cleanup
  };
}
