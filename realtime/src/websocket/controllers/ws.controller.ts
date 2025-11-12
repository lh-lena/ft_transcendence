import type { FastifyInstance, WSConnection } from 'fastify';
import type { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { ConnectionService } from '../types/ws.types.js';
import type { User } from '../../schemas/user.schema.js';
import { WSStatusCode } from '../../constants/status.constants.js';
import { NETWORK_QUALITY } from '../../constants/network.constants.js';
import { getRemoteAddress } from '../../utils/common.utils.js';
import { processDebugLog, handleWebSocketError } from '../../utils/error.handler.js';
import { type WsClientMessage, WsClientMessageSchema } from '../../schemas/ws.schema.js';

export const handleWSConnection = (
  connection: WebSocket,
  req: IncomingMessage,
  app: FastifyInstance,
): void => {
  const user = req.socket._user as User;
  if (user === undefined || user.userId === undefined) {
    connection.close(WSStatusCode.UNAUTHORIZED.code, WSStatusCode.UNAUTHORIZED.reason);
    return;
  }
  const ws = connection as WSConnection;
  initializeConnection(ws, user);
  const { userId } = ws.user;
  const remoteAddress = getRemoteAddress(req);
  processDebugLog(app, 'websocket-service', `User ${userId} connected from ${remoteAddress}`);
  const connectionService = app.connectionService as ConnectionService;
  connectionService.handleNewConnection(ws);
  setupEventListeners(ws, app);
};

function initializeConnection(ws: WSConnection, user: User): void {
  if (user === undefined || user.userId === undefined) return;

  ws.user = user;
  ws.gameId = null;
  ws.lastPing = Date.now();
  ws.lastPong = Date.now();
  ws.authenticated = true;
  ws.networkQuality = NETWORK_QUALITY.GOOD;
  ws.latency = 0;
  ws.missedPings = 0;
}

function setupEventListeners(ws: WSConnection, app: FastifyInstance): void {
  const connectionService = app.connectionService as ConnectionService;
  const { log } = app;
  const { userId } = ws.user;

  ws.on('message', (message: string) => {
    try {
      const { user } = ws;
      const rawMessage = JSON.parse(message.toString()) as WsClientMessage;
      const validationResult = WsClientMessageSchema.safeParse(rawMessage);
      if (!validationResult.success) {
        ws.close(WSStatusCode.INVALID_PAYLOAD.code, WSStatusCode.INVALID_PAYLOAD.reason);
        throw new Error(validationResult.error.issues.map((issue) => issue.message).join(', '));
      }
      const { event, payload } = validationResult.data;
      app.eventBus.emit(event, { user, payload });
    } catch (error: unknown) {
      handleWebSocketError(error, userId, message, app);
    }
  });

  ws.on('pong', () => {
    connectionService.handlePong(ws.user.userId);
  });

  ws.on('close', (code: number, reason: Buffer) => {
    if (String(reason) !== WSStatusCode.REPLACED.reason) {
      log.debug(
        `[websocket-service] Handling closing connection for user ${userId}. ${code}: ${reason.toString()}`,
      );
      connectionService.removeConnection(ws);
    }
  });

  ws.on('error', (err: Error) => {
    log.error(`[websocket-controller] WebSocket ${userId} error: ${err.message}`);
    connectionService.removeConnection(ws);
  });

  ws.on('open', () => {
    log.debug(`[websocket-controller] Connection opened for user ${userId}`);
  });
}
