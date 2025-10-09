import type { FastifyInstance } from 'fastify';
import type { ReconnectionService } from '../types/ws.types.js';
import type { EnvironmentConfig } from '../../config/config.js';
import type { RespondService, ConnectionService } from '../types/ws.types.js';
import type { GameSessionService, GameStateService } from '../../game/types/game.types.js';
import type { User, UserIdType } from '../../schemas/user.schema.js';
import type { GameError } from '../../utils/game.error.js';
import type { GameSession, GameIdType } from '../../schemas/game.schema.js';
import type { DisconnectInfo } from '../types/network.types.js';
import { processErrorLog } from '../../utils/error.handler.js';
import createGameValidator from '../../game/utils/game.validation.js';
import { NotificationType, GameSessionStatus } from '../../constants/game.constants.js';

export default function createReconnectionService(app: FastifyInstance): ReconnectionService {
  const disconnectedPlayers: Map<UserIdType, DisconnectInfo> = new Map();
  const reconnectionTimers: Map<UserIdType, NodeJS.Timeout> = new Map();

  const config = app.config as EnvironmentConfig;
  const validator = createGameValidator(app);
  const { log } = app;
  const RECONNECTION_TIMEOUT = config.websocket.connectionTimeout;

  function hasDisconnectData(userId: UserIdType): boolean {
    const hasData = disconnectedPlayers.has(userId);
    log.debug(`[reconnection-service] Found disconnect data for user ${userId}: ${hasData}`);
    return hasData;
  }

  function handlePlayerDisconnect(user: User, gameId: GameIdType): void {
    if (user === undefined || user.userId === undefined) return;
    const { userId, userAlias } = user;
    const respond = app.respond as RespondService;
    const gameSessionService = app.gameSessionService as GameSessionService;
    const gameStateService = app.gameStateService as GameStateService;
    log.debug(
      `[reconnection-service] Handling disconnect for user ${userId} (${userAlias}) in game ${gameId}`,
    );

    setPlayerDisconnectInfo(userId, userAlias ?? '', gameId);
    gameSessionService.setPlayerConnectionStatus(userId, gameId, false);
    respond.notificationToGame(
      gameId,
      NotificationType.WARN,
      `${userAlias} disconnected. Waiting for reconnection...`,
      [userId],
    );
    setReconnectionTimer(userId, gameId);
    const game = gameSessionService.getGameSession(gameId) as GameSession;
    gameStateService.pauseGame(game, userId);
  }

  function attemptReconnection(userId: UserIdType): GameIdType | null {
    const { log } = app;
    const gameSessionService = app.gameSessionService as GameSessionService;
    const gameStateService = app.gameStateService as GameStateService;
    const connectionService = app.connectionService as ConnectionService;
    const respond = app.respond as RespondService;
    const info = disconnectedPlayers.get(userId);
    if (info === undefined || info.gameId === null) {
      log.debug(
        `[reconnection-service] No disconnect info found for user ${userId} in game ${info?.gameId}`,
      );
      return null;
    }
    log.debug(
      { info },
      `[reconnection-service] Attempting reconnection for user ${userId} in game ${info.gameId}`,
    );
    const newConn = connectionService.getConnection(userId);
    if (newConn === undefined || newConn === null) {
      log.warn(`[reconnection-service] Connection for user ${userId} not found`);
      cleanup(userId);
      return null;
    }
    const { gameId } = info;
    connectionService.updateUserGame(userId, gameId);
    log.info(
      `[reconnection-service] Successfully reconnecting user ${userId} (${info.username}) to game ${gameId}`,
    );
    gameSessionService.setPlayerConnectionStatus(userId, gameId, true);
    respond.notificationToGame(
      gameId,
      NotificationType.INFO,
      `player ${newConn.user.userAlias} reconnected`,
      [userId],
    );
    cleanup(userId);
    const gameSession = validator.getValidGameCheckPlayer(gameId, userId);
    gameStateService.resumeGame(gameSession);
    return gameId;
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
    log.info(
      `[reconnection-service] User ${userId} ${info.username} failed to reconnect within timeout period`,
    );
    cleanup(userId);
    const gameSessionService = app.gameSessionService as GameSessionService;
    const game = gameSessionService.getGameSession(info.gameId) as GameSession;
    const respond = app.respond as RespondService;
    const gameStateService = app.gameStateService as GameStateService;
    if (
      game !== undefined &&
      game.status !== GameSessionStatus.FINISHED &&
      game.status !== GameSessionStatus.CANCELLED &&
      game.status !== GameSessionStatus.CANCELLED_SERVER_ERROR
    ) {
      respond.notificationToGame(
        info.gameId,
        NotificationType.WARN,
        `game over: ${info.username} failed to reconnect`,
        [userId],
      );
      await gameStateService
        .endGame(game, GameSessionStatus.CANCELLED_SERVER_ERROR)
        .catch((error: Error | GameError) => {
          processErrorLog(
            app,
            'reconnection-service',
            `Failed to end game ${info.gameId} due to error: `,
            error,
          );
        });
    }
  }

  function setReconnectionTimer(userId: UserIdType, gameId: GameIdType | null): void {
    const timeout: ReturnType<typeof setTimeout> = setTimeout((): void => {
      void (async (): Promise<void> => {
        log.debug(
          `[reconnection-service] Timeout expired for user ${userId} in the game ${gameId}`,
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
    log.debug(`[reconnection-service] Stored disconnect info for user ${userId}`);
  }

  function cleanup(userId?: UserIdType): void {
    if (userId === undefined) {
      log.debug(`[reconnection-service] Cleaning up all reconnection data`);
      disconnectedPlayers.clear();
      reconnectionTimers.forEach((timer) => clearTimeout(timer));
      reconnectionTimers.clear();
      return;
    }
    log.debug(`[reconnection-service] Cleaning up reconnection data for user ${userId}`);
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
    attemptReconnection,
    handlePlayerReconnection,
    cleanup,
  };
}
