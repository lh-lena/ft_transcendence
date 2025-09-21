import type { FastifyInstance, WSConnection } from 'fastify';
import { NETWORK_QUALITY } from '../../constants/network.constants.js';
import type { EnvironmentConfig } from '../../config/config.js';
import type { HeartbeatService, ConnectionRegistry } from '../types/ws.types.js';
import type { UserIdType } from '../../schemas/user.schema.js';

export default function createHeartbeatService(
  app: FastifyInstance,
  userConnections: ConnectionRegistry,
  onTimeout: (userId: UserIdType) => void,
  onPong: (userId: UserIdType, latency: number, quality: NETWORK_QUALITY) => void,
): HeartbeatService {
  const { log } = app;
  const config = app.config as EnvironmentConfig;
  const CONNECTION_TIMEOUT = config.websocket.connectionTimeout;

  function startHeartbeat(userId: UserIdType, heartbeatInterval: number): void {
    const conn = userConnections.get(userId);
    if (conn === undefined) {
      log.warn(
        `[connection-service] Cannot start heartbeat for user ${userId} - connection not found`,
      );
      return;
    }

    if (conn.heartbeatTimer !== undefined) {
      clearInterval(conn.heartbeatTimer);
    }
    const timer = setInterval(() => {
      sendPing(userId);
    }, heartbeatInterval);
    conn.heartbeatTimer = timer;
    conn.missedPings = 0;
    conn.lastPong = Date.now();
    log.info(`[connection-service] Heartbeat started: every ${heartbeatInterval / 1000}s`);
  }

  function sendPing(id: UserIdType): void {
    const conn = userConnections.get(id);
    if (conn === undefined) {
      log.debug(`[connection-service] Cannot send ping - connection ${id} not found`);
      return;
    }

    const pingTime = Date.now();
    try {
      conn.ping();
      conn.lastPing = pingTime;

      const timeout = CONNECTION_TIMEOUT;
      if (pingTime - conn.lastPong > timeout) {
        conn.missedPings++;
        if (conn.missedPings >= 3) {
          log.debug(`[connection-service] Client ${id} missed 3 pings - handling connection loss`);
          onTimeout(id);
        }
      }
    } catch (error: unknown) {
      log.error(
        `[connection-service] Error sending ping to ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      onTimeout(id);
    }
  }

  function handlePong(userId: UserIdType): void {
    const conn = userConnections.get(userId);
    if (conn === undefined) {
      log.warn(`[connection-service] Received pong from unknown connection ${userId}`);
      return;
    }

    const now = Date.now();
    const latency = now - conn.lastPing;
    conn.missedPings = 0;

    let networkQuality = NETWORK_QUALITY.GOOD;
    if (latency < 50) {
      networkQuality = NETWORK_QUALITY.GOOD;
    } else if (latency < 150) {
      networkQuality = NETWORK_QUALITY.FAIR;
    } else {
      networkQuality = NETWORK_QUALITY.POOR;
    }
    onPong(userId, latency, networkQuality);
  }

  function stopHeartbeat(connection: WSConnection): void {
    if (connection === null || connection === undefined) {
      log.warn(`[connection-service] Cannot stop heartbeat - connection not found`);
      return;
    }

    if (connection.heartbeatTimer) {
      clearInterval(connection.heartbeatTimer);
      connection.heartbeatTimer = undefined;
      log.debug(`[connection-service] Heartbeat stopped for user ${connection.user.userId}`);
    }
  }

  return {
    startHeartbeat,
    handlePong,
    stopHeartbeat,
  };
}
