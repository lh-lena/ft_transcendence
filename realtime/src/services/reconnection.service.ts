import { FastifyInstance, WSConnection } from 'fastify';
import { DisconnectInfo } from '../types/network.types.js';
import { GameSessionStatus, NotificationType } from '../types/game.types.js';
import { GameError } from '../utils/game.error.js';
import { User } from '../schemas/user.schema.js';

export default function reconnectionService(app: FastifyInstance) {
  const disconnectedPlayers: Map<number, DisconnectInfo> = new Map();
  const reconnectionTimers: Map<number, NodeJS.Timeout> = new Map();

  const config = {
    reconnectionTimeout: app.config.websocket.connectionTimeout,
  };

  function getDiconnectionData(userId: number) : DisconnectInfo | undefined {
    const info = disconnectedPlayers.get(userId);
    app.log.debug(`[reconnection-service] Getting disconnect info for user ${userId}: ${info ? 'found' : 'not found'}`);
    return info;
  }

  async function handleDisconnect(user: User, gameId: string): Promise<void> {
    const { userId, userAlias } = user;
    app.log.debug(`[reconnection-service] Handling disconnect for user ${userId} (${userAlias}) in game ${gameId}`);

    const game = app.gameSessionService.getGameSession(gameId);
    if (!game) {
      app.log.warn(`[reconnection-service] Cannot handle disconnection - game not found ${gameId}`);
      return;
    }

    const status = game.gameState.status;
    if (
      disconnectedPlayers.has(userId) ||
      status === GameSessionStatus.FINISHED ||
      status === GameSessionStatus.CANCELLED ||
      status === GameSessionStatus.CANCELLED_SERVER_ERROR
    ) {
      app.log.debug(`[reconnection-service] Disconnect ignored: already disconnected or game not active.`);
      return;
    }
    setPlayerDisconnectInfo(userId, userAlias, gameId);
    app.gameSessionService.setPlayerConnectionStatus(userId, gameId, false);
    app.log.debug(`[reconnection-service] Player ${userId} marked as disconnected in game ${gameId}`);
    app.respond.notificationToGame(gameId, 'info', `${userAlias} disconnected. Waiting for reconnection...`, [userId]);
    const connTimeout = config.reconnectionTimeout;
    const timeout = setTimeout(() => {
      app.log.debug(`[reconnection-service] Timeout expired for user ${userId}`);
      handleReconnectionTimeout(userId);
    }, connTimeout);
    reconnectionTimers.set(userId, timeout);

    if (status !== GameSessionStatus.PAUSED) {
      await app.gameStateService.pauseGame(userId, game);
      app.log.debug(`[reconnection-service] Game ${gameId} paused due to disconnect of user ${userId}`);
    } else {
      app.log.debug(`[reconnection-service] Game ${gameId} already paused, skipping pause`);
    }
  }

  async function attemptReconnection(userId: number): Promise<string | null >{
    const info = disconnectedPlayers.get(userId);
    if (!info || !info.gameId) {
      app.log.debug(`[reconnection-service] No disconnect info found for user ${userId} in game ${info?.gameId}`);
      return null;
    }
    app.log.debug({info},`[reconnection-service] Attempting reconnection for user ${userId} in game ${info.gameId}`);
    const newConn = app.connectionService.getConnection(userId) as WSConnection | undefined;
    if (!newConn) {
      app.log.info(`[reconnection-service] Connection for user ${userId} not found`);
      cleanup(userId);
      return null;
    }
    const { gameId } = info;
    app.connectionService.updateUserGame(userId, gameId);
    app.log.info(`[reconnection-service] Successfully reconnecting user ${userId} (${info.username}) to game ${gameId}`);
    app.gameSessionService.setPlayerConnectionStatus(userId, gameId, true);
    app.respond.notificationToGame(gameId, NotificationType.INFO, `player ${newConn.user.userAlias} reconnected`, [userId]);
    cleanup(userId);
    await app.gameService.handleGameResume(newConn.user, gameId);
    return gameId;
  }

  function handleReconnectionTimeout(userId: number): void {
    app.log.debug(`[reconnection-service] Handling reconnection timeout for user ${userId}`);
    const info = disconnectedPlayers.get(userId);
    if (!info || !info.gameId) return;

    app.log.info(`[reconnection-service] User ${userId} ${info.username} failed to reconnect within timeout period`);

    const game = app.gameSessionService.getGameSession(info.gameId);
    if (game && (game.status !== GameSessionStatus.FINISHED && game.status !== GameSessionStatus.CANCELLED && game.status !== GameSessionStatus.CANCELLED_SERVER_ERROR)) {
      app.respond.notificationToGame(info.gameId, NotificationType.WARN, `Game ended: ${info.username} failed to reconnect`, [userId]);
      app.gameStateService
      .endGame(info.gameId, GameSessionStatus.CANCELLED,`Player ${info.username} failed to reconnect`)
      .catch((error: Error | GameError) => {
        app.log.debug(`[reconnection-service] Failed to end game ${info.gameId} due to error: ${error instanceof ( Error || GameError) ? error.message : String(error)}`);
      });
    }
    cleanup(userId);
  }

  function setPlayerDisconnectInfo(userId: number, username: string, gameId: string): void {
    const info: DisconnectInfo = {
      userId,
      username,
      gameId,
      disconnectTime: Date.now()
    }
    disconnectedPlayers.set(userId, info);
    app.log.debug(`[reconnection-service] Stored disconnect info for user ${userId}`);
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

  app.addHook('onClose', async () => {
    app.log.debug(`[reconnection-service] Cleaning up reconnection service on server close`);
    reconnectionTimers.forEach(timer => clearTimeout(timer));
    reconnectionTimers.clear();
    disconnectedPlayers.clear();
  });

  return {
    handleDisconnect,
    getDiconnectionData,
    attemptReconnection,
    cleanup,
  }
}
