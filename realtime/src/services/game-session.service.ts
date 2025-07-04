import { FastifyInstance } from 'fastify';
import { GameInstance, StartGame, GameSessionStatus, GameMode } from '../types/pong.types.js';
// import { validateGameExists, createStructuredLogger } from '../utils/index.js';
import { initializeGameState } from './pong-engine.service.js';

export default function createGameSessionService(app: FastifyInstance) {
  const gameSessions: Map<string, GameInstance> = new Map();

  async function createGameSession(gameId: string, gameData: StartGame): Promise<GameInstance> {
    if (gameSessions.has(gameId)) {
      app.log.debug(`[game-session] Game session ${gameId} already exists`);
      return gameSessions.get(gameId)!;
    }

    const newGame: GameInstance = {
      ...gameData,
      gameState: initializeGameState(gameId),
      status: GameSessionStatus.PENDING,
      gameLoopInterval: undefined,
      lastUpdate: Date.now(),
      startedAt: null,
      finishedAt: null,
    };

    storeGameSession(newGame);
    assignPlayersToGame(newGame);
    return newGame;
  }

  function getGameSession(gameId: string) : GameInstance | undefined {
    const session = gameSessions.get(gameId);
    app.log.debug(`[game-session] Getting game session ${gameId}: ${session ? 'found' : 'not found'}`);
    return session;
  }

  function storeGameSession(game: GameInstance): void {
    gameSessions.set(game.gameId, game);
    app.log.debug(`[game-session] Stored game session ${game.gameId}`);
  }

  function removeGameSession(gameId: string): boolean {
    const removed = gameSessions.delete(gameId);
    if (removed) {
      app.log.debug(`[game-session] Removed game session ${gameId}`);
    }
    return removed;
  }

  function assignPlayersToGame(game: GameInstance): void {
    game.players.forEach(player => {
      if (player.userId !== -1) {
        app.connectionService.updateUserGame(player.userId, game.gameId);
      }
    });
  }

  // async function initializeGameSession(gameId: string, startGameData?: StartGame): Promise<GameInstance | undefined> {
  //   if (gameSessions.has(gameId)) {
  //     const existing = gameSessions.get(gameId);
  //     app.log.debug(`[game-session]Game session ${gameId} already exists, using existing instance`);
  //     return existing;
  //   }
  //   app.log.debug(`[game-session]Initializing game session ${gameId}`);

  //   let data: StartGame | null = null;;
  //   if (startGameData) {
  //     data = startGameData;
  //     app.log.debug(`[game-session] Using provided game data for ${gameId}`);
  //   } else {
  //     try {
  //       data = await fetchInitialGameData(gameId);
  //       if (!data) {
  //         app.log.warn(`[game-session] No game data fetched for ${gameId}`);
  //         app.wsService.broadcastToGame(gameId, {
  //           event: 'error',
  //           payload: { 'error': `Game not found or invalid: ${gameId}` }
  //         });
  //         return undefined;
  //       }
  //     } catch (error) {
  //       app.log.error(`[game-session] Failed to fetch game data for ${gameId}:`, error);
  //       app.wsService.broadcastToGame(gameId, {
  //         event: 'error',
  //         payload: {
  //           'error': `Failed to fetch game data for game: ${gameId}`
  //         }
  //       });
  //       return undefined;
  //     }
  //   }

  //   if (data.gameId !== gameId) {
  //     app.log.error(`[game-session] Game ID mismatch: expected ${gameId}, got ${data.gameId}`);
  //     app.wsService.broadcastToGame(gameId, {
  //       event: 'error',
  //       payload: {
  //         'error': `Invalid game data for game: ${gameId}`
  //       }
  //     });
  //     return undefined;
  //   }

  //   const newGame: GameInstance = {
  //     ...data,
  //     gameState: initializeGameState(gameId),
  //     status: GameSessionStatus.PENDING,
  //     gameLoopInterval: undefined,
  //     lastUpdate: Date.now(),
  //     startedAt: null,
  //     finishedAt: null,
  //   };

  //   app.connectionService.updateUserGame(newGame.players[0].userId, gameId);
  //   if (data.gameMode === GameMode.PVP_REMOTE && data.players[1] && data.players[1].userId !== -1) {
  //     app.connectionService.updateUserGame(newGame.players[1].userId, gameId);
  //   }
  //   app.log.debug(`[game-session] Game session initialized: ${gameId} for players: ${newGame.players.map(p => p.userAlias).join(' vs ')} in mode ${newGame.gameMode}`);
  //   return newGame;
  // }

  return {
    getGameSession,
    createGameSession,
    // initializeGameSession,
    removeGameSession,
    storeGameSession,
  };
}
