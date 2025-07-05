import { FastifyInstance, WSConnection } from 'fastify';
import { DisconnectInfo } from '../types/network.types.js';
import { GAME_CONFIG, GameSessionStatus, NotificationPayload } from '../types/pong.types.js';

export default function reconnectionService(app: FastifyInstance) {
  const disconnectedPlayers: Map<number, DisconnectInfo> = new Map();
  const reconnectionTimers: Map<number, NodeJS.Timeout> = new Map();

  const config = {
    reconnectionTimeout: app.config.websocket.connectionTimeout || 60000,
    cleanupInterval: 300000 // 5 minutes
  };

  function getDiconnectionData(userId: number) : DisconnectInfo | undefined {
    const info = disconnectedPlayers.get(userId);
    app.log.debug(`[reconnection-service] Getting disconnect info for user ${userId}: ${info ? 'found' : 'not found'}`);
    return info;
  }

  function handleDisconnect(userId: number, gameId: string, username: string): void {
    app.log.info(`[reconnection-service] Handling disconnect for user ${userId} (${username}) in game ${gameId}`);
    const game = app.gameSessionService.getGameSession(gameId);
    if (!game) {
      app.log.warn({
        userId,
        gameId
      }, 'Cannot handle disconnection - game not found');
      return;
    }

    if (disconnectedPlayers.has(userId) || 
    game.gameState.status === GameSessionStatus.FINISHED ||
    game.gameState.status === GameSessionStatus.CANCELLED) {
      return;
    }

    const connTimeout = config.reconnectionTimeout;
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
      app.log.debug(`[reconnection-service] Timeout expired for user ${userId}`);
      handleReconnectionTimeout(userId);
    }, connTimeout);

    reconnectionTimers.set(userId, timeout);
    app.gameService.pauseGame(gameId, `${username} disconnected`);
    app.log.info({
      userId,
      gameId,
      username,
      timeoutMs: config.reconnectionTimeout
    }, 'User disconnected, waiting for reconnection');
  };

  function attemptReconnection(userId: number): string | null {
    const info = disconnectedPlayers.get(userId);
    if (!info || !info.gameId) {
      app.log.debug(`[reconnection-service] No disconnect info found for user ${userId}, game ${info?.gameId}`);
      return null;
    }
    app.log.debug({info},`[reconnection-service] Attempting reconnection for user ${userId}`);

    const newConn = app.connectionService.getConnection(userId) as WSConnection | undefined;
    if (!newConn) {
      app.log.info(`[reconnection-service] Connection for user ${userId} not found`);
      cleanup(userId);
      return null;
    }

    const { gameId } = info;
    const gameSession = app.gameSessionService.getGameSession(gameId);
    if (!gameSession || gameSession.status !== GameSessionStatus.PAUSED) {
      app.log.info(`[reconnection-service] Game ${info.gameId} no longer exists`);
      cleanup(userId);
      return null;
    }
    app.log.info(`[reconnection-service] Successfully reconnecting user ${userId} (${info.username}) to game ${gameId}`);

    newConn.isReconnecting = true;
    cleanup(userId);

    const msg : NotificationPayload = {
      gameId,
      message: `Player ${newConn.userAlias} reconnected`,
      timestamp: Date.now()
    }
    app.wsService.broadcastToGame(gameId, {"event": "notification", msg}, [userId]);

    if (app.gameService.canStartGame(gameId) && gameSession.status === GameSessionStatus.PAUSED ) {
        app.gameService.resumeGame(gameId);
    } else {
      app.log.debug(`[reconnection-service] Game ${gameId} cannot be resumed. Players connected: ${app.gameService.isPlayersConnected(gameId)})`);
    }

    return gameId;
  }

  function handleReconnectionTimeout(userId: number): void {
    app.log.info(`[reconnection-service] Handling reconnection timeout for user ${userId}`);
    const info = disconnectedPlayers.get(userId);
    if (!info || !info.gameId) return;

    app.log.info(`[reconnection-service] User ${userId} (${info.username}) failed to reconnect within timeout period`);
    app.log.info(`[reconnection-service] Ending game ${info.gameId} due to timeout`);

    const game = app.gameSessionService.getGameSession(info.gameId);
    if (game && (game.status !== GameSessionStatus.FINISHED && game.status !== GameSessionStatus.CANCELLED)) {
      app.gameService.endGame(info.gameId, GameSessionStatus.CANCELLED,`Player ${info.username} failed to reconnect`);
    }
    const payload: NotificationPayload = {
      gameId: info.gameId,
      message: `Game ended: ${info.username} failed to reconnect`,
      timestamp: Date.now()
    };
    app.wsService.broadcastToGame(info.gameId, { event: "notification", payload });
    cleanup(userId);
  }

  function cleanup(userId?: number) {
    if (userId) {
      app.log.debug(`[reconnection-service] Cleaning up reconnection data for user ${userId}`);
      const timer = reconnectionTimers.get(userId);
      if (timer) {
        clearTimeout(timer);
        reconnectionTimers.delete(userId);
        app.log.debug(`[reconnection-service] Cleared timer for user ${userId}`);
      }
      disconnectedPlayers.delete(userId);
    } else { // editional clean up
      const now = Date.now();
      const expired: number[] = [];
      
      disconnectedPlayers.forEach((info, id) => {
        if (now - info.disconnectTime > config.reconnectionTimeout + config.reconnectionTimeout) {
          expired.push(id);
        }
      });

      expired.forEach(id => {
        disconnectedPlayers.delete(id);
        const timer = reconnectionTimers.get(id);
        if (timer) {
          clearTimeout(timer);
          reconnectionTimers.delete(id);
        }
      });
      
      if (expired.length > 0) {
        app.log.debug({
          cleaned: expired.length
        }, 'Cleaned up expired disconnection entries');
      }
    }
  }

  const cleanupInterval = setInterval(
    () => cleanup(),
    config.cleanupInterval
  );

  app.addHook('onClose', async () => {
    clearInterval(cleanupInterval);
    reconnectionTimers.forEach(timer => clearTimeout(timer));
    reconnectionTimers.clear();
    disconnectedPlayers.clear();
  });

  return {
    handleDisconnect,
    getDiconnectionData,
    attemptReconnection,
    handleReconnectionTimeout,
    cleanup,
  }
}
