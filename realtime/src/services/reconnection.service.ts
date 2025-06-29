import { FastifyInstance, WSConnection } from 'fastify';
import { DisconnectInfo } from '../types/network.types.js';
import { GameSessionStatus, NotificationPayload } from '../types/pong.types.js';

export default function reconnectionService(app: FastifyInstance) {
  const disconnectedPlayers: Map<number, DisconnectInfo> = new Map();
  const reconnectionTimers: Map<number, NodeJS.Timeout> = new Map();

  function getDiconnectionData(userId: number) : DisconnectInfo | undefined {
    const info = disconnectedPlayers.get(userId);
    app.log.debug(`[reconnection-service] Getting disconnect info for user ${userId}: ${info ? 'found' : 'not found'}`);
    return info;
  }

  function handleDisconnect(userId: number, gameId: string, username: string): void {
    app.log.info(`[reconnection-service] Handling disconnect for user ${userId} (${username}) in game ${gameId}`);

    if (!gameId) {
      app.log.warn(`[reconnection-service] No gameId provided for user ${userId}`);
      return;
    }

    if (disconnectedPlayers.has(userId)) {
      app.log.warn(`[reconnection-service] User ${userId} already in disconnected players list`);
      return;
    }

    const connTimeout = app.config.websocket.connectionTimeout || 60000;
    app.log.debug(`[reconnection-service] Setting ${connTimeout}ms timeout for user ${userId} to reconnect`);

    const info: DisconnectInfo = {
      userId,
      username,
      gameId,
      disconnectTime: Date.now()
    }
    disconnectedPlayers.set(userId, info);
    app.log.debug(`[reconnection-service] Stored disconnect info for user ${userId}`);

    const event = 'notification';
    const payload: NotificationPayload = {
      gameId,
      message: `${username} disconnected. Waiting for reconnection...`,
      timestamp: Date.now()
    };

    app.wsService.broadcastToGame(gameId, {event, payload}, [userId]);

    const timeout = setTimeout(() => {
      app.log.info(`[reconnection-service] Timeout expired for user ${userId}`);
      handleReconnectionTimeout(userId);
    }, connTimeout);

    reconnectionTimers.set(userId, timeout);
    app.log.info(`[reconnection-service] Reconnection timer set for user ${userId} (${connTimeout}ms)`);
  };

  function attemptReconnection(userId: number): string | null {
    app.log.debug(`[reconnection-service] Attempting reconnection for user ${userId}`);
    const info = disconnectedPlayers.get(userId);
    if (!info || !info.gameId) {
      app.log.info(`[reconnection-service] No disconnect info found for user ${userId}, game ${info?.gameId}`);
      return null;
    }

    const newConn = app.connectionService.getConnection(userId) as WSConnection | undefined;
    if (!newConn) {
      app.log.info(`[reconnection-service] Connection for user ${userId} not found`);
      return null;
    }

    const { gameId } = info;
    const gameSession = app.gameService.getGameSession(gameId);
    if (!gameSession || (gameSession.status !== GameSessionStatus.PAUSED && gameSession.status !== GameSessionStatus.PENDING)) {
      app.log.info(`[reconnection-service] Game ${info.gameId} no longer exists`);
      cleanup(userId);
      return null;
    }
    app.log.info(`[reconnection-service] Successfully reconnecting user ${userId} (${info.username}) to game ${gameId}`);

    newConn.isReconnecting = true;
    const timer = reconnectionTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      reconnectionTimers.delete(userId);
      app.log.debug(`[reconnection-service] Cleared reconnection timer for user ${userId}`);
    }

    const msg : NotificationPayload = {
      gameId,
      message: `Player ${newConn.username} reconnected`,
      timestamp: Date.now()
    }
    app.wsService.broadcastToGame(gameId, {"event": "notification", msg}, [userId]);

    if (app.gameService.canStartGame(gameId)) {
      if (gameSession.status === GameSessionStatus.PENDING) {
        app.gameService.startGame(gameId);
      } else if (gameSession.status === GameSessionStatus.PAUSED) {
        app.gameService.resumeGame(gameId);
      }
    } else {
      app.log.debug(`[reconnection-service] Game ${gameId} cannot be resumed. Players connected: ${app.gameService.isPlayersConnected(gameId)})`);
    }

    cleanup(userId);
    return gameId;
  }

  function handleReconnectionTimeout(userId: number): void {
    app.log.info(`[reconnection-service] Handling reconnection timeout for user ${userId}`);
    const info = disconnectedPlayers.get(userId);
    if (!info || !info.gameId) return;

    app.log.info(`[reconnection-service] User ${userId} (${info.username}) failed to reconnect within timeout period`);
    app.log.info(`[reconnection-service] Ending game ${info.gameId} due to timeout`);

    app.gameService.endGame(info.gameId, `Player ${info.username} failed to reconnect`);
    const payload: NotificationPayload = {
      gameId: info.gameId,
      message: `Game ended: ${info.username} failed to reconnect`,
      timestamp: Date.now()
    };
    app.wsService.broadcastToGame(info.gameId, { event: "notification", payload });
    cleanup(userId);
  }

  function cleanup(userId: number) {
    app.log.debug(`[reconnection-service] Cleaning up reconnection data for user ${userId}`);
    const timer = reconnectionTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      reconnectionTimers.delete(userId);
      app.log.debug(`[reconnection-service] Cleared timer for user ${userId}`);
    }
    disconnectedPlayers.delete(userId);
  }

  return {
    handleDisconnect,
    getDiconnectionData,
    attemptReconnection,
    handleReconnectionTimeout,
    cleanup,
  }
}
