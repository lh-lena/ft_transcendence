import type { FastifyInstance, WSConnection } from 'fastify';
import { NETWORK_QUALITY } from '../../constants/network.constants.js';
import type { EnvironmentConfig } from '../../config/config.js';
import type { HeartbeatService, ConnectionRegistry } from '../types/ws.types.js';
import type { UserIdType } from '../../schemas/user.schema.js';
import {
  processDebugLog,
  processErrorLog,
  processInfoLog,
  processWarnLog,
} from '../../utils/error.handler.js';

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
      processWarnLog(
        app,
        'connection-service',
        `Cannot start heartbeat for user ${userId} - connection not found`,
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
    processInfoLog(
      app,
      'connection-service',
      `Heartbeat started: every ${heartbeatInterval / 1000}s`,
    );
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
        processInfoLog(
          app,
          'connection-service',
          `Client ${id} missed ${conn.missedPings} pings. Timeout: ${timeout}ms`,
        );
        if (conn.missedPings >= 3) {
          processInfoLog(
            app,
            'connection-service',
            `Client ${id} missed 3 pings - handling connection loss`,
          );
          onTimeout(id);
        }
      }
    } catch (error: unknown) {
      processErrorLog(app, 'connection-service', `Error sending ping to ${id}:`, error);
      onTimeout(id);
    }
  }

  function handlePong(userId: UserIdType): void {
    const conn = userConnections.get(userId);
    if (conn === undefined) {
      processWarnLog(app, 'connection-service', `Received pong from unknown connection ${userId}`);
      return;
    }

    const now = Date.now();
    const latency = now - conn.lastPing;
    conn.missedPings = 0;
    conn.lastPong = now;

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
      processWarnLog(app, 'connection-service', `Cannot stop heartbeat - connection not found`);
      return;
    }

    if (connection.heartbeatTimer) {
      clearInterval(connection.heartbeatTimer);
      connection.heartbeatTimer = undefined;
      processDebugLog(
        app,
        'connection-service',
        `Heartbeat stopped for user ${connection.user.userId}`,
      );
    }
  }

  return {
    startHeartbeat,
    handlePong,
    stopHeartbeat,
  };
}
