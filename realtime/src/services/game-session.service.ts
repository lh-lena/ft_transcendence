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

  function getAllActiveGameSessions(): GameInstance[] {
    const activeSessions: GameInstance[] = [];
    gameSessions.forEach((session) => {
      if (session.status !== GameSessionStatus.FINISHED &&
        session.status !== GameSessionStatus.CANCELLED &&
        session.status !== GameSessionStatus.CANCELLED_SERVER_ERROR) {
        activeSessions.push(session);
      }
    });
    return activeSessions;
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
    app.log.debug(`Updated game session ${gameId}. Updates: ${Object.keys(updates).join(', ')}`);
    return true;
  }

  function shutdown(): void {
    const activeSessions = getAllActiveGameSessions();
    activeSessions.forEach((session) => {
      app.log.info(`[game-session] Shutting down game session ${session.gameId}`);
      session.status = GameSessionStatus.CANCELLED_SERVER_ERROR;
      session.gameLoopInterval && clearInterval(session.gameLoopInterval);
      app.gameStateService.endGame(session.gameId, GameSessionStatus.CANCELLED_SERVER_ERROR, 'Server shutdown');
    });
    gameSessions.clear();

    app.log.info('[game-session] All game sessions cleared');
  }

  return {
    getGameSession,
    createGameSession,
    removeGameSession,
    storeGameSession,
    setPlayerConnectionStatus,
    updateGameSession,
    shutdown
  };
}
