import { FastifyInstance, WSConnection } from 'fastify';
import { ErrorServerMsg } from '../types/error.types.js';
import { NETWORK_QUALITY } from '../types/network.types.js';
import { NotificationType } from '../types/game.types.js';

export default function connectionService(app: FastifyInstance) {
  const userConnections: Map<number, WSConnection> = new Map();

  const config = app.config.websocket;

  function addConnection(conn: WSConnection): void {
    const { userId } = conn.user;
    const existingConn = userConnections.get(userId);
    if (existingConn) {
      app.log.info(`[connection-service] Replacing existing connection for user ${userId}`);
      stopHeartbeat(existingConn);
      existingConn.close(1000, ErrorServerMsg.REPLACED);
    }
    userConnections.set(userId, conn);
    startHeartbeat(userId, config.heartbeatInterval);
    app.log.info(`[connection-service] New connection ${userId} added to service. Total connections: ${userConnections.size}`);
  }

  function removeConnection(conn: WSConnection): void {
    if (!conn) {
      app.log.warn(`[connection-service] Attempted to remove null connection`);
      return;
    }

    stopHeartbeat(conn);
    const { userId } = conn.user;
    const { gameId } = conn;
    if (!gameId) {
      app.log.debug(`[connection-service] User ${userId} disconnected and not in a game`);
    } else {
      app.reconnectionService.handleDisconnect(conn.user, gameId);
    }
    userConnections.delete(userId);
    app.log.debug(`[connection-service] Connection removed for user ${userId}. Remaining connections: ${userConnections.size}`);
  }

  function getConnection(userId: number): WSConnection | undefined {
    return userConnections.get(userId);
  }

  function updateUserGame(userId: number, gameId: string | null): void {
    const conn = userConnections.get(userId);
    if (!conn) {
      app.log.warn(`[connection-service] Cannot update game for connection, user ${userId} - connection not found`);
      return;
    }

    conn.gameId = gameId;
    app.log.debug(`[connection-service] User ${userId} assigned to game ${gameId}`);
  }

  function handleNewConnection(conn: WSConnection): void {
    const { userId } = conn.user;
    addConnection(conn);
    const disconnectInfo = app.reconnectionService.getDiconnectionData(userId);
    if (disconnectInfo) {
      app.reconnectionService.attemptReconnection(userId);
    }
    app.respond.connected(userId);
  }

  function startHeartbeat(userId: number, heartbeatInterval: number): void {
    const conn = userConnections.get(userId);
    if (!conn) {
      app.log.warn(`[connection-service] Cannot start heartbeat for user ${userId} - connection not found`);
      return;
    }

    if (conn?.heartbeatTimer) {
      clearInterval(conn.heartbeatTimer);
    }
    const timer = setInterval(() => {
      sendPing(userId);
    }, heartbeatInterval);
    conn.heartbeatTimer = timer;
    conn.missedPings = 0;
    conn.lastPong = Date.now();
    app.log.info(`[connection-service] Heartbeat started: every ${config.heartbeatInterval / 1000}s`);
  }

  function sendPing(id: number): void {
    const conn = userConnections.get(id);
    if (!conn) {
      app.log.debug(`[network-service] Cannot send ping - connection ${id} not found`);
      return;
    }

    const pingTime = Date.now();
    try {
      conn.ping();
      conn.lastPing = pingTime;

      const timeout = config.connectionTimeout;
      if (pingTime - conn.lastPong > timeout) {
        conn.missedPings++;
        if (conn.missedPings >= 3) {
          app.log.error(`[network-service] Client ${id} missed 3 pings - handling connection loss`);
          handleConnectionLoss(id);
        }
      }
    } catch (error: any) {
      app.log.error(`[network-service] Error sending ping to ${id}: ${error.message}`);
      handleConnectionLoss(id);
    }
  }

  function handlePong(id: number): void {
    const conn = userConnections.get(id);
    if (!conn) {
      app.log.warn(`[network-service] Received pong from unknown connection ${id}`);
      return;
    }

    const now = Date.now();
    const latency = now - conn.lastPing;

    conn.lastPong = now;
    conn.missedPings = 0;
    conn.latency = latency;

    if (latency < 50) {
      conn.networkQuality = NETWORK_QUALITY.GOOD;
    } else if (latency < 150) {
      conn.networkQuality = NETWORK_QUALITY.FAIR;
    } else {
      conn.networkQuality = NETWORK_QUALITY.POOR;
    }
  }

  function stopHeartbeat(connection: WSConnection): void {
    if (!connection) {
      app.log.debug(`[connection-service] Cannot stop heartbeat - connection not found`);
      return;
    }

    if (connection.heartbeatTimer) {
      clearInterval(connection.heartbeatTimer);
      connection.heartbeatTimer = undefined;
      app.log.debug(`[connection-service] Heartbeat stopped for user ${connection.user.userId}`);
    }
  }

  function handleConnectionLoss(id: number): void {
    app.log.info(`[connection-service] Handling connection loss for client ${id}`);
    const conn = userConnections.get(id);
    if (!conn) {
      app.log.warn(`[network-service] Connection ${id} already removed`);
      return;
    }

    stopHeartbeat(conn);
    conn.networkQuality = NETWORK_QUALITY.DISCONNECTED;
    try {
      app.log.debug(`[connection-service] Closing connection for client ${id}`);
      conn.close(1001, ErrorServerMsg.CONNECTION_LOST);
    } catch (error: any) {
      app.log.error(`[connection-service] Error closing connection ${id}: ${error.message}`);
    }
  }

  async function notifyShutdown(): Promise<void> {
    app.log.info(`[connection-service] Notifying ${userConnections.size} clients of shutdown`);

    const notifications = Array.from(userConnections).map(async ([userId, conn]) => {
      try {
        if (conn.readyState === WebSocket.OPEN) {
          app.respond.error(userId, ErrorServerMsg.SHUTDOWN);
          app.respond.notification(userId, NotificationType.INFO, ErrorServerMsg.SHUTDOWN);
          app.log.debug(`[connection-service] Notified user ${conn.user.userId} of shutdown`);
        } else {
          app.log.debug(`[connection-service] Skipped user ${conn.user.userId} - connection not open. State: ${conn.readyState}`);
        }
      } catch (error) {
        app.log.debug(`[connection-service] Could not notify user ${conn.user.userId} of shutdown`);
      }
    });
  
    await Promise.allSettled(notifications);
  }

  async function shutdown(): Promise<void> {
    app.log.info(`[connection-service] Closing active ${userConnections.size} connections`);
    const closingPromises = Array.from(userConnections.values()).map(async (conn) => {
      try {
          conn.removeAllListeners();
          conn.close(1001, ErrorServerMsg.SHUTDOWN);
          if (conn) {
            removeConnection(conn);
          }
      } catch (error) {
        app.log.debug(`[connection-service] Error closing connection for user ${conn.user.userId}`);
      }
    });
    await Promise.allSettled(closingPromises);
    await new Promise(resolve => setTimeout(resolve, 1000));
    userConnections.clear();
    app.log.info('[connection-service] All connections closed');
  }

  return {
    addConnection,
    removeConnection,
    getConnection,
    handleNewConnection,
    updateUserGame,
    notifyShutdown,
    handlePong,
    shutdown,
  }
}
