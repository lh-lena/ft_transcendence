import { FastifyInstance, WSConnection } from 'fastify';
import { NETWORK_GUALITY } from '../types/network.types.js';

export default function networkMonitorService(app: FastifyInstance) {
  function sendPing(id: number): void {
    const conn = app.connectionService.getConnection(id) as WSConnection | null;
    if (!conn) return;

    const pingTime = Date.now();

    try {
      conn.ping();

      conn.lastPing = pingTime;

      const timeout = app.config.websocket.connectionTimeout || 60000;
      if (pingTime - conn.lastPong > timeout) {
        conn.missedPings++;
        if (conn.missedPings >= 3) {
          handleConnectionLoss(id);
        }
      }
    } catch (error: any) {
      app.log.error(`[network-service] Error sending ping to ${id}:`, error);
      handleConnectionLoss(id);
    }
  }

  function handlePong(id: number): void {
    const conn = app.connectionService.getConnection(id) as WSConnection | null;
    if (!conn) return;

    conn.lastPong = Date.now();
    conn.missedPings = 0;
    if (conn.heartbeatTimeout) {
      clearTimeout(conn.heartbeatTimeout);
    }
  }

  function handleConnectionLoss(id: number): void {
    app.log.info('[network-service] Handling lost connection ', id);
    const conn = app.connectionService.getConnection(id) as WSConnection | null;
    if (!conn) return;

    conn.networkQuality = NETWORK_GUALITY.DISCONNECTED;

    const { currentGameId } = conn;
    if (currentGameId) {
      app.reconnectionService.handleDisconnect(id, currentGameId);
    }

    try {
      conn.close(1001, 'Connection lost');
    } catch (error) {
      app.log.error('Error closing lost connection:', error);
    }
  }

  return {
    sendPing,
    handlePong,
    handleConnectionLoss
  }
}
