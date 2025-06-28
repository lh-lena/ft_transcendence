import { FastifyInstance, WSConnection } from 'fastify';
import { NETWORK_QUALITY } from '../types/network.types.js';

export default function networkMonitorService(app: FastifyInstance) {
  function sendPing(id: number): void {
    const conn = app.connectionService.getConnection(id);
    if (!conn) {
      app.log.debug(`[network-service] Cannot send ping - connection ${id} not found`);
      return;
    }

    const pingTime = Date.now();
    try {
      conn.ping();
      conn.lastPing = pingTime;
      
      const timeout = app.config.websocket.connectionTimeout || 60000;
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
    app.log.info(`[network-service] Sending ping to client ${id}`);
  }

  function handlePong(id: number): void {
    const conn = app.connectionService.getConnection(id);
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

    app.log.debug(`[network-service] Pong received from client ${id} - Latency: ${latency}ms, Quality: ${conn.networkQuality}`);
  }

  function handleConnectionLoss(id: number): void {
    app.log.info(`[network-service] Handling connection loss for client ${id}`);
    const conn = app.connectionService.getConnection(id);
    if (!conn) {
      app.log.warn(`[network-service] Connection ${id} already removed`);
      return;
    }

    conn.networkQuality = NETWORK_QUALITY.DISCONNECTED;
    try {
      app.log.info(`[network-service] Closing connection for client ${id}`);
      conn.close(1001, 'Connection lost');
    } catch (error: any) {
      app.log.error(`[network-service] Error closing connection ${id}: ${error.message}`);
    }
  }

  return {
    sendPing,
    handlePong,
    handleConnectionLoss
  }
}
