import { FastifyInstance, WSConnection } from 'fastify';

export default function connectionService(app: FastifyInstance) {
  const userConnections: Map<number, WSConnection> = new Map();

  const config = app.config?.websocket || {
    connectionTimeout: 60_000,
    heartbeatInterval: 30_000
  }

  function addConnection(conn: WSConnection): void {
    const existingConn = userConnections.get(conn.userId);
    if (existingConn) {
      app.log.info(`[connection-service] Replacing existing connection for user ${existingConn.userId}`);
      if (existingConn?.heartbeatTimer) {
        clearInterval(existingConn.heartbeatTimer);
      }
      existingConn.close(1000, 'Replaced by new connection');
    }
    const { userId } = conn;
    userConnections.set(userId, conn);
    startHeartbeat(userId, config.heartbeatInterval);
    app.log.info(`[connection-service] New connection ${userId} added to service. Total connections: ${userConnections.size}`);
  }

  function removeConnection(conn: WSConnection): void {
    if (!conn) {
      app.log.warn(`[connection-service] Attempted to remove null connection`);
      return;
    }

    if (conn?.heartbeatTimer) {
      clearInterval(conn.heartbeatTimer);
    }
    if (!conn.gameId) {
      app.log.debug(`[connection-service] User ${conn.userId} disconnected and not in a game`);
    } else {
      app.reconnectionService.handleDisconnect(conn.userId, conn.gameId, conn.username);
      
    }
    userConnections.delete(conn.userId);
    app.log.debug(`[connection-service] Connection removed for user ${conn.userId} (remaining connections: ${userConnections.size})`);
  }

  function getConnection(userId: number): WSConnection | undefined {
    return userConnections.get(userId);
  }

  function getAllConnections(): Map<number, WSConnection> {
    return userConnections;
  }

  function updateUserGame(userId: number, gameId: string): void {
    const conn = userConnections.get(userId);
    if (!conn) {
      app.log.warn(`[connection-service] Cannot update game for user ${userId} - connection not found`);
      return;
    }
    
    app.log.info(`[connection-service] User ${userId} assigned to game ${gameId}`);
    conn.gameId = gameId;
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
      app.networkService.sendPing(userId);
    }, heartbeatInterval);
    conn.heartbeatTimer = timer;
    conn.missedPings = 0;
    conn.lastPong = Date.now();
    app.log.info(`[connection-service] Heartbeat started: every ${config.heartbeatInterval / 1000}s`);
  }

  async function shutdown(): Promise<void> {
    app.log.info(`[connection-service] Shutting down - closing ${userConnections.size} connections`);
    const closingPromises = Array.from(userConnections).map(([userId, conn]) => {
      return new Promise<void>(resolve => {
        app.log.info(`[connection-service] Closing connection for user ${userId}`);
        conn.once('close', () => resolve());
        conn.removeAllListeners();
        conn.close(1000, 'Server shutting down');
        if (conn) {
          removeConnection(conn);
        }
      });
    });
    await Promise.allSettled(closingPromises);
    userConnections.clear();
  }

  return {
    addConnection,
    removeConnection,
    getConnection,
    getAllConnections,
    updateUserGame,
    shutdown,
    startHeartbeat
  }
}
