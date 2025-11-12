import type { FastifyInstance } from 'fastify';
import type { ReconnectionService } from '../types/ws.types.js';
import type { EnvironmentConfig } from '../../config/config.js';
import type { GameSessionService, GameStateService } from '../../game/types/game.types.js';
import type { User, UserIdType } from '../../schemas/user.schema.js';
import type { GameError } from '../../utils/game.error.js';
import type { GameSession, GameIdType } from '../../schemas/game.schema.js';
import type { DisconnectInfo } from '../types/network.types.js';
import { processErrorLog, processDebugLog, processInfoLog } from '../../utils/error.handler.js';
import { getPlayerName } from '../../game/utils/index.js';
import { GameSessionStatus } from '../../constants/game.constants.js';

export default function createReconnectionService(app: FastifyInstance): ReconnectionService {
  const disconnectedPlayers: Map<UserIdType, DisconnectInfo> = new Map();
  const reconnectionTimers: Map<UserIdType, NodeJS.Timeout> = new Map();

  const config = app.config as EnvironmentConfig;
  const RECONNECTION_TIMEOUT = config.websocket.connectionTimeout;

  function hasDisconnectData(userId: UserIdType): boolean {
    const hasData = disconnectedPlayers.has(userId);
    processDebugLog(
      app,
      'reconnection-service',
      `Found disconnect data for user ${userId}: ${hasData}`,
    );
    return hasData;
  }

  function handlePlayerDisconnect(user: User, gameId: GameIdType): void {
    if (user === undefined || user.userId === undefined) return;
    const { userId } = user;
    const userAlias = getPlayerName(user);
    const gameSessionService = app.gameSessionService as GameSessionService;
    const gameStateService = app.gameStateService as GameStateService;
    setPlayerDisconnectInfo(userId, userAlias ?? '', gameId);
    gameSessionService.setPlayerReadyStatus(userId, gameId, false);
    gameSessionService.setPlayerConnectionStatus(userId, gameId, false);
    setReconnectionTimer(userId, gameId);
    const game = gameSessionService.getGameSession(gameId) as GameSession;
    gameStateService.pauseGame(game, userId);
  }

  function handlePlayerReconnection(userId: UserIdType): DisconnectInfo | undefined {
    const info = disconnectedPlayers.get(userId);
    if (info === undefined) {
      return undefined;
    }
    cleanup(userId);
    return info;
  }

  async function handleReconnectionTimeout(userId: UserIdType): Promise<void> {
    const info = disconnectedPlayers.get(userId);
    if (info === undefined || info.gameId === undefined || info.gameId === null) return;
    processInfoLog(
      app,
      'reconnection-service',
      `User ${userId} ${info.username} failed to reconnect within timeout period`,
    );
    cleanup(userId);
    const gameSessionService = app.gameSessionService as GameSessionService;
    const game = gameSessionService.getGameSession(info.gameId) as GameSession;
    const gameStateService = app.gameStateService as GameStateService;
    if (
      game !== undefined &&
      game.status !== GameSessionStatus.FINISHED &&
      game.status !== GameSessionStatus.CANCELLED &&
      game.status !== GameSessionStatus.CANCELLED_SERVER_ERROR
    ) {
      await gameStateService
        .endGame(game, GameSessionStatus.CANCELLED, userId)
        .catch((error: Error | GameError) => {
          processErrorLog(
            app,
            'reconnection-service',
            `Failed to end game ${info.gameId} due to error:`,
            error,
          );
        });
    }
  }

  function setReconnectionTimer(userId: UserIdType, gameId: GameIdType | null): void {
    const timeout: ReturnType<typeof setTimeout> = setTimeout((): void => {
      void (async (): Promise<void> => {
        processDebugLog(
          app,
          'reconnection-service',
          `Timeout expired for user ${userId} in the game ${gameId}`,
        );
        await handleReconnectionTimeout(userId);
      })();
    }, RECONNECTION_TIMEOUT);
    reconnectionTimers.set(userId, timeout);
  }

  function setPlayerDisconnectInfo(
    userId: UserIdType,
    username: string,
    gameId: GameIdType | null,
  ): void {
    const info: DisconnectInfo = {
      userId,
      username,
      gameId,
      disconnectTime: Date.now(),
    };
    disconnectedPlayers.set(userId, info);
    processDebugLog(app, 'reconnection-service', `Stored disconnect info for user ${userId}`);
  }

  function cleanup(userId?: UserIdType): void {
    if (userId === undefined) {
      processDebugLog(app, 'reconnection-service', `Cleaning up all reconnection data`);
      disconnectedPlayers.clear();
      reconnectionTimers.forEach((timer) => clearTimeout(timer));
      reconnectionTimers.clear();
      return;
    }
    processDebugLog(
      app,
      'reconnection-service',
      `Cleaning up reconnection data for user ${userId}`,
    );
    const timer = reconnectionTimers.get(userId);
    if (timer !== undefined) {
      clearTimeout(timer);
      reconnectionTimers.delete(userId);
    }
    disconnectedPlayers.delete(userId);
  }

  return {
    handlePlayerDisconnect,
    hasDisconnectData,
    handlePlayerReconnection,
    cleanup,
  };
}
