import { FastifyInstance } from 'fastify';
import { GameSessionStatus } from '../types/game.types.js';
import { StartGame, GameSession } from '../schemas/game.schema.js';
import { initializeGameState } from './pong-engine.service.js';

export default function createGameSessionService(app: FastifyInstance) {
  const gameSessions: Map<string, GameSession> = new Map();

  async function createGameSession(
    gameId: string,
    gameData: StartGame,
  ): Promise<GameSession | null> {
    if (gameSessions.has(gameId)) {
      app.log.debug(
        `[game-session] Game session ${gameId} already exists. Replacing it`,
      );
    }

    const newGame: GameSession = {
      ...gameData,
      isConnected: new Map(),
      gameState: initializeGameState(gameId),
      status: GameSessionStatus.PENDING,
      gameLoopInterval: undefined,
      startedAt: null,
      finishedAt: null,
      lastSequence: 0,
      countdownInterval: undefined,
    };
    return newGame;
  }

  function getGameSession(gameId: string): GameSession | undefined {
    const session = gameSessions.get(gameId);
    return session;
  }

  function getAllActiveGameSessions(): GameSession[] {
    const activeSessions: GameSession[] = [];
    gameSessions.forEach((session) => {
      if (
        session.status !== GameSessionStatus.FINISHED &&
        session.status !== GameSessionStatus.CANCELLED &&
        session.status !== GameSessionStatus.CANCELLED_SERVER_ERROR
      ) {
        activeSessions.push(session);
      }
    });
    return activeSessions;
  }

  function storeGameSession(game: GameSession): void {
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

  function setPlayerConnectionStatus(
    userId: number,
    gameId: string,
    connected: boolean,
  ): void {
    const gameSession = gameSessions.get(gameId);
    if (!gameSession) {
      throw new Error(`[game-session] Game session ${gameId} not found`);
    }
    if (connected) {
      gameSession.isConnected.set(userId, connected);
    } else {
      gameSession.isConnected.delete(userId);
    }
    app.log.debug(
      `[game-session] Player ${userId} in the game ${gameId} is ${connected ? 'connected' : 'disconnected'}`,
    );
  }

  function updateGameSession(
    gameId: string,
    updates: Partial<GameSession>,
  ): boolean {
    const game = gameSessions.get(gameId);
    if (!game) {
      app.log.debug(`[game-session] Cannot update - game not found ${gameId}`);
      return false;
    }

    Object.assign(game, updates);
    app.log.debug(
      `[game-session] Updated game session ${gameId}. Updates: ${Object.keys(updates).join(', ')}`,
    );
    return true;
  }

  async function shutdown(): Promise<void> {
    const activeSessions = getAllActiveGameSessions();
    for (const session of activeSessions) {
      try {
        app.log.debug(
          `[game-session] Closing a game session ${session.gameId}`,
        );
        app.respond.notificationToGame(
          session.gameId,
          'error',
          'server error occurred. game session is cancelled.',
        );
        await app.gameStateService.endGame(
          session,
          GameSessionStatus.CANCELLED_SERVER_ERROR,
        );
      } catch (error) {
        app.log.error(
          `[game-session] Error closing a game session ${session.gameId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }
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
    shutdown,
  };
}
