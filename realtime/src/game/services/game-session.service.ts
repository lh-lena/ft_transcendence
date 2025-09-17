import type { FastifyInstance } from 'fastify';
import { GameSessionStatus, NotificationType } from '../../constants/game.constants.js';
import type { StartGame, GameSession, GameIdType } from '../../schemas/game.schema.js';
import { initializeGameState } from '../../game/engines/pong/pong.engine.js';
import type { RespondService } from '../../websocket/types/ws.types.js';
import type { GameStateService, GameSessionService } from '../types/game.types.js';
import { processErrorLog, processDebugLog, processInfoLog } from '../../utils/error.handler.js';
import type { UserIdType } from '../../schemas/user.schema.js';

export default function createGameSessionService(app: FastifyInstance): GameSessionService {
  const gameSessions: Map<GameIdType, GameSession> = new Map();

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

  function createGameSession(gameId: GameIdType, gameData: StartGame): GameSession | null {
    if (gameSessions.has(gameId)) {
      processDebugLog(app, 'game-session', `Game session ${gameId} already exists. Replacing it`);
    }

    const newGame: GameSession = {
      ...gameData,
      isConnected: new Map(),
      gameState: initializeGameState(gameId),
      status: GameSessionStatus.PENDING,
      gameLoopInterval: undefined,
      startedAt: undefined,
      finishedAt: undefined,
      countdownInterval: undefined,
    };
    return newGame;
  }

  function getGameSession(gameId: GameIdType): GameSession | undefined {
    const session = gameSessions.get(gameId);
    return session;
  }

  function storeGameSession(game: GameSession): void {
    gameSessions.set(game.gameId, game);
    processDebugLog(app, 'game-session', `Stored game session ${game.gameId}`);
  }

  function removeGameSession(gameId: GameIdType): boolean {
    const removed = gameSessions.delete(gameId);
    if (removed) {
      processDebugLog(app, 'game-session', `Removed game session ${gameId}`);
    }
    return removed;
  }

  function setPlayerConnectionStatus(
    userId: UserIdType,
    gameId: GameIdType,
    connected: boolean,
  ): void {
    const gameSession = gameSessions.get(gameId);
    if (gameSession === undefined || gameSession === null) {
      throw new Error(`Game session ${gameId} not found`);
    }
    if (connected) {
      gameSession.isConnected.set(userId, connected);
    } else {
      gameSession.isConnected.delete(userId);
    }
    processDebugLog(
      app,
      'game-session',
      `Player ${userId} in the game ${gameId} is ${connected ? 'connected' : 'disconnected'}`,
    );
  }

  function updateGameSession(gameId: GameIdType, updates: Partial<GameSession>): boolean {
    const game = gameSessions.get(gameId);
    if (game === undefined || game === null) {
      processErrorLog(app, 'game-session', `Cannot update - game not found ${gameId}`);
      return false;
    }

    Object.assign(game, updates);
    processDebugLog(
      app,
      'game-session',
      `Updated game session ${gameId}. Updates: ${Object.keys(updates).join(', ')}`,
    );
    return true;
  }

  async function shutdown(): Promise<void> {
    const activeSessions = getAllActiveGameSessions();
    const respond = app.respond as RespondService;
    const gameStateService = app.gameStateService as GameStateService;
    for (const session of activeSessions) {
      try {
        processDebugLog(app, 'game-session', `Closing a game session ${session.gameId}`);
        respond.notificationToGame(
          session.gameId,
          NotificationType.ERROR,
          'server error occurred. game session is cancelled.',
        );
        await gameStateService.endGame(session, GameSessionStatus.CANCELLED_SERVER_ERROR);
      } catch (error: unknown) {
        processErrorLog(app, 'game-session', `Error closing game session ${session.gameId}`, error);
      }
    }
    gameSessions.clear();
    processInfoLog(app, 'game-session', 'All game sessions cleared');
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
