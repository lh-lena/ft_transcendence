import { FastifyInstance, WSConnection } from 'fastify';
import type { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { User } from '../types/pong.types.js';
import { NETWORK_GUALITY } from '../types/network.types.js';

let game = 0;
export const handleWSConnection = (
  connection: WebSocket,
  req: IncomingMessage,
  app: FastifyInstance) => {

  const user = (req.socket as any)._user as User;
  const { userId, username, userAlias } = user;

  const ws = connection as WSConnection;
  ws.userId = userId;
  ws.username = username;
  ws.userAlias = userAlias;
  ws.currentGameId = '0';
  ws.lastPing = Date.now();
  ws.lastPong = Date.now();
  ws.authenticated = true;
  ws.isReconnecting = false;
  ws.networkQuality = NETWORK_GUALITY.GOOD;
  ws.latency = 0;
  ws.missedPings = 0;

  const remoteIp = req.socket.remoteAddress || 'unknown';
  app.log.info(`[websocket-service] User ${userId} connected from ${remoteIp}`);

  app.connectionService.addConnection(ws);
  app.gameService.startGameSession((game++).toString());

  ws.on('message', async (message: string) => {
    app.log.info(`[${userId}] Received: ${message}`);
    try {
      // const parsedMessage = await JSON.parse(message.toString());
      // const { event, payload } = parsedMessage;
      // TODO: handle events
      ws.send(`Echo from server: ${message}`); // rm
    } catch (error: any) {
      app.log.error(`[${ws.userId}] Failed to parse WebSocket message: ${error.message}, Message: '${message}'`);
      ws.send(JSON.stringify({
        event: 'error',
        payload: { error: 'Invalid JSON message', timestamp: Date.now() }
      }));
    }
  });

  ws.on('pong', () => {
    app.networkService.handlePong(userId);
  });

  ws.on('close', (code: number, reason: Buffer) => {
    app.log.info(`[websocket-service] WebSocket ${userId} closed the connection. ${code}: ${reason.toString()}`);
    const conn = app.connectionService.getConnection(userId);
    if (!conn || !conn.currentGameId) {
      app.log.info(`[websocket-service] User ${userId} disconnected.`);
    } else {
      app.reconnectionService.handleDisconnect(userId, conn.currentGameId, conn.username);
    }

    app.connectionService.removeConnection(ws);
  });

  ws.on('error', (err: any) => {
    app.log.error(`[websocket-service] WebSocket ${userId} error: ${err.message}`);
    const conn = app.connectionService.getConnection(userId);
    if (!conn || !conn.currentGameId) {
      app.log.info(`[websocket-service] Network error. User ${userId} disconnected.`);
    } else {
      app.reconnectionService.handleDisconnect(userId, conn.currentGameId, conn.username);
    }
  });
};
