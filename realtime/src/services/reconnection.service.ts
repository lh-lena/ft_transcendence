import { FastifyInstance, WSConnection } from 'fastify';
import { DisconnectInfo } from 'types/network.types';
import { NotificationPayload } from 'types/pong.types';

export default function reconnectionService(app: FastifyInstance) {
  const disconnectedPlayers: Map<number, DisconnectInfo> = new Map();
  const reconnectionTimers: Map<number, NodeJS.Timeout> = new Map();

  function handleDisconnect(userId: number, gameId: string, username: string): void {
    const conn = app.connectionService.getConnection(userId) as WSConnection | null;
    if (!conn || conn.currentGameId === undefined) return;

    const connTimeout = app.config.websocket.connectionTimeout;

    app.log.info(`[reconnection-service] Handling disconnect for user ${userId} in game ${gameId}`);

    const info: DisconnectInfo = {
      userId,
      username,
      gameId,
      disconnectTime: Date.now()
    }

    disconnectedPlayers.set(userId, info);

    const eventNotif = 'notification';
    const payloadNotif: NotificationPayload = {
      gameId,
      message: `${username} disconnected`,
      timestamp: Date.now()
    };

    app.wsService.broadcastToGame(gameId, {eventNotif, payloadNotif}, [userId]);
    app.gameService.pauseGame(gameId, `${conn.username} disconnection`);

    const timeout = setTimeout(() => {
      handleReconnectionTimeout(userId);
    }, connTimeout);

    reconnectionTimers.set(userId, timeout);
    const event = 'pause_game';
    const payload = {
      gameId
    };
    app.wsService.broadcastToGame(gameId, {event, payload}, [userId]);
  };

  function attemptReconnection(userId: number): boolean {
    const info = disconnectedPlayers.get(userId);
    if (!info) {
      app.log.info(`[reconnection-service] No disconnect info found for user ${userId}`);
      return false;
    }

    const newConn = app.connectionService.getConnection(userId) as WSConnection;
    if (!newConn) {
      app.log.info(`[reconnection-service] Connection for user ${userId} not found`);
      return false;
    }

    newConn.currentGameId = info.gameId;
    newConn.username = info.username;

    const gameId = info.gameId;
    if (!gameId) {
      app.log.info(`[reconnection-service] Game ${gameId} no longer exists`);
      cleanup(userId);
      return false;
    }

    const gameSession = app.gameService.getGameSession(gameId);
    if (!gameSession) {
      app.log.info(`[reconnection-service] Game ${gameId} no longer exists`);
      cleanup(userId);
      return false;
    }
    app.log.info(`[reconnection-service] Reconnecting user ${userId} to game ${gameId}`);

    newConn.isReconnecting = true;
    const timer = reconnectionTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      reconnectionTimers.delete(userId);
    }

    const { gameState } = gameSession;
    app.wsService.sendToConnection(userId, {"event": "game_state_sync", "payload": { gameState }});

    const msg : NotificationPayload = {
      gameId,
      message: `Player ${newConn.username} reconnected`,
      timestamp: Date.now()
    }
    app.wsService.broadcastToGame(gameId, {"event": "notification", msg}, [userId]);
    app.gameService.resumeGame(gameId); // TODO: internaly in gameServise implement tryToResume check if both player connected

    cleanup(userId);
    return true;
  }

  function handleReconnectionTimeout(userId: number): void {
    const info = disconnectedPlayers.get(userId);
    if (!info || !info.gameId) return;

    app.log.info(`[reconnection-service] Reconnection timeout for user ${info.userId} in game ${info.gameId}`);

    app.gameService.endGame(info.gameId, `Player ${info.username} failed to reconnect`);

    cleanup(userId);
  }

  function cleanup(userId: number) {
    const timer = reconnectionTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      reconnectionTimers.delete(userId);
    }
    disconnectedPlayers.delete(userId);
  }

  return {
    handleDisconnect,
    attemptReconnection,
    handleReconnectionTimeout,
    cleanup,
  }
}
