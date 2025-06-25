import { FastifyInstance, WSConnection } from 'fastify';

export default function connectionService(app: FastifyInstance) {
  const userConnections = new Map<number, WSConnection>();

  const config = app.config?.websocket || {
    connectionTimeout: 60_000,
    heartbeatInterval: 30_000
  }

  function addConnection(conn: WSConnection): void {
    const existingConn = userConnections.get(conn.userId);
    if (existingConn) {
      app.log.info('[connection-service] replacing connection for user ', existingConn.userId);
      removeConnection(existingConn);
      existingConn.close(1000, 'Replaced by new connection');
    }
    const { userId } = conn;
    userConnections.set(userId, conn);
    startHeartbeat(userId);
    app.log.info(`[connection-service]  New connection ${userId} added to service`);
  }

  function removeConnection(conn: WSConnection): void {
    if (!conn) return;
    // if (conn.heartbeatTimeout) clearTimeout(conn.heartbeatTimeout);
    // if (conn.reconnectTimer) clearTimeout(conn.reconnectTimer);

    userConnections.delete(conn.userId);
    app.log.info(`[connection-service] Connection ${conn.userId} removed`);
  }

  function getConnection(userId: number): WSConnection | null {
    const conn = userConnections.get(userId);
    if (conn) {
      return conn;
    }
    return null;
  }

  function getAllConnections(): WSConnection[] {
    return Array.from(userConnections.values());
  }

  function startHeartbeat(userId: number): void {

    const timer = setInterval(() => {
      app.networkService.sendPing(userId);
    }, config.heartbeatInterval);
    
    const conn = app.connectionService.getConnection(userId);
    if (conn) {
      conn.heartbeatTimer = timer;
    }

    app.log.info(`[connection-service] Heartbeat started: every ${config.heartbeatInterval / 1000}s`);
  }

  async function shutdown(): Promise<void> {
    const closingPromises = Array.from(userConnections).map(conn => {
      return new Promise<void>(resolve => {
        conn[1].once('close', () => resolve());
        conn[1].removeAllListeners();
        conn[1].close(1000, 'Server shutting down');
        if (conn) {
          removeConnection(conn[1]);
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
    shutdown,
    startHeartbeat
  }
}
