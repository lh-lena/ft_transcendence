import { WebSocket } from 'ws';
import type { FastifyInstance, WSConnection } from 'fastify';
import type { EnvironmentConfig } from '../../config/config.js';
import type { RespondService, ConnectionService } from '../types/ws.types.js';
import type { GameSessionService } from '../../game/types/game.types.js';
import createConnectionRegistry from './connection.registry.js';
import createReconnectionService from './reconnection.service.js';
import createHeartbeatService from './heartbeat.service.js';
import type { NETWORK_QUALITY } from '../../constants/network.constants.js';
import { NotificationType } from '../../constants/game.constants.js';
import { WSStatusCode } from '../../constants/status.constants.js';
import { processErrorLog, processDebugLog } from '../../utils/error.handler.js';
import type { UserIdType, GameIdType } from '../../schemas/index.js';
import { metricsService } from '../../metrics/metrics.service.js';

export default function createConnectionService(app: FastifyInstance): ConnectionService {
  const { log } = app;
  const config = app.config as EnvironmentConfig;
  const userConnections = createConnectionRegistry();
  const reconnectionService = createReconnectionService(app);
  const heartbeatService = createHeartbeatService(
    app,
    userConnections,
    handleHeartbeatTimeout,
    updateConnectionQuality,
  );
  const HEARTBEAT_INTERVAL = config.websocket.heartbeatInterval;
  const MAX_CONNECTIONS = config.websocket.maxConnections;

  function handleHeartbeatTimeout(userId: UserIdType): void {
    log.info(`[connection-service] Handling heartbeat timeout for client ${userId}`);
    handleConnectionLoss(userId);
  }

  function updateConnectionQuality(
    userId: UserIdType,
    latency: number,
    quality: NETWORK_QUALITY,
  ): void {
    const conn = userConnections.get(userId);
    if (conn !== undefined) {
      conn.latency = latency;
      conn.networkQuality = quality;
    }
  }

  function handlePong(userId: UserIdType): void {
    heartbeatService.handlePong(userId);
  }

  function handleNewConnection(conn: WSConnection): void {
    if (conn === null || conn === undefined) {
      log.warn(`[connection-service] Connection undefined`);
      return;
    }
    const respond = app.respond as RespondService;
    const { userId } = conn.user;
    if (userConnections.size() >= MAX_CONNECTIONS) {
      conn.close(WSStatusCode.SERVICE_UNAVAILABLE.code, WSStatusCode.SERVICE_UNAVAILABLE.reason);
      return;
    }
    addConnection(conn);
    if (reconnectionService.hasDisconnectData(userId)) {
      reconnectPlayer(userId);
      return;
    }
    respond.connected(userId);
    processUserOnline(userId, true).catch((error: unknown) => {
      processErrorLog(app, 'connection-service', 'Error processing user status:', error);
    });
  }

  function addConnection(conn: WSConnection): void {
    if (conn === null || conn === undefined) return;
    const { userId } = conn.user;
    const existingConn = userConnections.get(userId);

    if (existingConn !== undefined) {
      replaceExistingConnection(conn, existingConn);
    }
    userConnections.set(userId, conn);
    heartbeatService.startHeartbeat(userId, HEARTBEAT_INTERVAL);
    metricsService.wsConnectionsGauge.set(userConnections.size());
    log.info(
      `[connection-service] New connection added to service. Total connections: ${userConnections.size()}`,
    );
  }

  function replaceExistingConnection(newConn: WSConnection, oldConn: WSConnection): void {
    if (newConn === undefined || oldConn === undefined) return;
    const { userId } = oldConn.user;

    log.info(`[connection-service] Replacing existing connection for user ${userId}`);
    heartbeatService.stopHeartbeat(oldConn);
    const gameId: GameIdType | null | undefined = oldConn.gameId;
    if (gameId !== undefined && gameId !== null) {
      newConn.gameId = gameId;
      reconnectionService.handlePlayerDisconnect(oldConn.user, gameId);
    }
    userConnections.remove(userId);
    oldConn.close(WSStatusCode.REPLACED.code, WSStatusCode.REPLACED.reason);
  }

  function removeConnection(conn: WSConnection): void {
    if (conn === undefined || conn === null) return;
    const { userId } = conn.user;
    const { gameId } = conn;

    heartbeatService.stopHeartbeat(conn);
    processUserOnline(userId, false).catch((error: unknown) => {
      processErrorLog(app, 'connection-service', 'Error processing user status:', error);
    });
    if (gameId !== undefined && gameId !== null) {
      reconnectionService.handlePlayerDisconnect(conn.user, gameId);
    }
    userConnections.remove(userId);
    metricsService.wsConnectionsGauge.set(userConnections.size());
    log.info(
      `[connection-service] Connection removed for user ${userId}. Remaining: ${userConnections.size()}`,
    );
  }

  function handleConnectionLoss(userId: UserIdType): void {
    log.info(`[connection-service] Handling connection loss for client ${userId}`);

    const conn = userConnections.get(userId);
    if (conn === undefined) {
      log.warn(`[connection-service] Connection ${userId} already removed`);
      return;
    }

    heartbeatService.stopHeartbeat(conn);
    processUserOnline(userId, false).catch((error: unknown) => {
      processErrorLog(app, 'connection-service', 'Error processing user status:', error);
    });
    userConnections.remove(userId);

    try {
      conn.close(WSStatusCode.CONNECTION_LOST.code, WSStatusCode.CONNECTION_LOST.reason);
    } catch (error: unknown) {
      processErrorLog(app, 'connection-service', `Error closing connection ${userId}:`, error);
    }
  }

  function reconnectPlayer(userId: UserIdType): void {
    const gameSessionService = app.gameSessionService as GameSessionService;
    const disconnectInfo = reconnectionService.handlePlayerReconnection(userId);
    if (disconnectInfo === undefined) {
      log.warn(`[connection-service] No disconnect info found for user ${userId}`);
      return;
    }

    const { gameId } = disconnectInfo as { gameId: GameIdType };
    updateUserGame(userId, gameId);
    gameSessionService.setPlayerConnectionStatus(userId, gameId, true);
    gameSessionService.setPlayerReadyStatus(userId, gameId, true); //added

    const respond = app.respond as RespondService;
    respond.connected(userId);
    processUserOnline(userId, true).catch((error: unknown) => {
      processErrorLog(app, 'connection-service', 'Error processing user status:', error);
    });
    respond.notificationToGame(
      gameId,
      NotificationType.INFO,
      `player ${disconnectInfo.username} reconnected`,
      [userId],
    );

    log.info(`[connection-service] User ${userId} reconnected to game ${gameId}`);
  }

  function getConnection(userId: UserIdType): WSConnection | undefined {
    const conn = userConnections.get(userId);
    return conn;
  }

  function updateUserGame(userId: UserIdType, gameId: GameIdType | null): void {
    const conn = userConnections.get(userId);
    if (conn === undefined) {
      log.warn(`[connection-service] Cannot update game ID for user ${userId} - connection not found`);
      return;
    }
    conn.gameId = gameId;
    processDebugLog(app, 'connection-service', `User ${userId} game updated to ${gameId}`);
  }

  async function notifyShutdown(): Promise<void> {
    const respond = app.respond as RespondService;
    log.info(`[connection-service] Notifying ${userConnections.size()} clients of shutdown`);

    const allConnections = userConnections.getAll();
    const notifications = Array.from(allConnections).map(([userId, conn]) => {
      try {
        if (conn !== undefined && conn.readyState === WebSocket.OPEN) {
          respond.notification(userId, NotificationType.INFO, WSStatusCode.GOING_AWAY.reason);
          processDebugLog(app, 'connection-service', `Notified user ${userId} of shutdown`);
        } else {
          log.info(
            `[connection-service] Skipped user ${userId} - connection not open or already removed`,
          );
        }
      } catch (error: unknown) {
        processErrorLog(
          app,
          'connection-service',
          `Failed to notify user ${userId} of shutdown:`,
          error,
        );
      }
    });
    await Promise.allSettled(notifications);
  }

  async function processUserOnline(userId: UserIdType, online: boolean): Promise<void> {
    try {
      const res = await fetch(`${config.websocket.backendUrl}/api/user/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ online }),
      });
      if (!res.ok) {
        processErrorLog(
          app,
          'connection-service',
          `Failed to update user ${userId} online status`,
          `Status: ${res.status} - ${res.statusText}`,
        );
      }
    } catch (error: unknown) {
      processErrorLog(
        app,
        'connection-service',
        `Failed to update online status for user ${userId}`,
        error,
      );
    }
  }

  async function shutdown(): Promise<void> {
    const allConnections = userConnections.getAll();
    log.info(`[connection-service] Closing active ${userConnections.size()} connections`);

    const closingPromises = Array.from(allConnections.values()).map((conn: WSConnection) => {
      try {
        if (conn !== undefined) {
          removeConnection(conn);
        }
        conn.removeAllListeners();
        conn.close(WSStatusCode.GOING_AWAY.code, WSStatusCode.GOING_AWAY.reason);
      } catch (error: unknown) {
        processErrorLog(
          app,
          'connection-service',
          `Error closing connection for user ${conn.user.userId}`,
          error,
        );
      }
    });

    await Promise.allSettled(closingPromises);
    userConnections.clear();
    reconnectionService.cleanup();
    log.info('[connection-service] All connections closed');
  }

  return {
    handleNewConnection,
    addConnection,
    removeConnection,
    handleConnectionLoss,
    getConnection,
    updateUserGame,
    handlePong,
    reconnectPlayer,
    notifyShutdown,
    shutdown,
  };
}
