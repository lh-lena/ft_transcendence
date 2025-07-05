import { FastifyInstance } from 'fastify';
import { GameInstance, StartGame, GameSessionStatus, User } from '../types/pong.types.js';
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
      connectedPlayer1: false,
      connectedPlayer2: false,
      gameState: initializeGameState(gameId),
      status: GameSessionStatus.PENDING,
      gameLoopInterval: undefined,
      lastUpdate: Date.now(),
      startedAt: null,
      finishedAt: null,
    };

    storeGameSession(newGame);
    return newGame;
  }

  function getGameSession(gameId: string) : GameInstance | undefined {
    const session = gameSessions.get(gameId);
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

  function setPlayerConnectionStatus(userId: number, gameId: string, connected: boolean): void {
    const gameSession = gameSessions.get(gameId);

    if (!gameSession) {
      throw new Error(`[game-session] Game session ${gameId} not found`);
    }
    const { players } = gameSession;
    const playerIdx: number = players.findIndex(p => p.userId == userId && p.userId !== -1);
    if (playerIdx === -1) {
      return;
    }
    if (playerIdx === 0) {
      gameSession.connectedPlayer1 = connected;
      app.log.debug(`[game-session] Player ${userId} in the game ${gameId} as Player 1: ${connected}`);
    } else if (playerIdx === 1) {
      gameSession.connectedPlayer2 = connected;
      app.log.debug(`[game-session] Player ${userId} connected in the game ${gameId} as Player 2: ${connected}`);
    }
  }

  function updateGameSession(gameId: string, updates: Partial<GameInstance>): boolean {
    const game = gameSessions.get(gameId);
    if (!game) {
      app.log.debug(`Cannot update - game not found ${ gameId }`);
      return false;
    }

    Object.assign(game, updates);
    app.log.debug({ gameId, updates: Object.keys(updates) }, `Updated game session`);
    return true;
  }

  // function addPlayerToGame(gameId: string, user: User): void {
  //   const gameSession = gameSessions.get(gameId);

  //   if (!gameSession) {
  //     throw new Error(`[game-session] Game session ${gameId} not found`);
  //   }
  //   const { players } = gameSession;
  //   const existingPlayerInSession = players.find(p => p.userId === user.userId);

  //   if (existingPlayerInSession) {
  //     // Player is already in the game session. This is a reconnect scenario.
  //     // Just update their connection status.
  //     app.log.debug(`[game-service] User ${user.userId} already in game ${gameId}. Updating connection status.`);
  //     setPlayerConnectionStatus(user.userId, gameId, true);
  //     return;
  //   }

  //   if (gameSession.status !== GameSessionStatus.PENDING) {
  //     throw new Error(`Game ${gameId} is not in a joinable state. Status: ${gameSession.status}`);
  //   }

  // }

  return {
    getGameSession,
    createGameSession,
    removeGameSession,
    storeGameSession,
    setPlayerConnectionStatus
  };
}
