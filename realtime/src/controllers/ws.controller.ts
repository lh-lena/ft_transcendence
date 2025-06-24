import type { FastifyInstance, WSConnection } from 'fastify';
import type { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { User } from '../types/pong.types.js';
import { NETWORK_GUALITY } from '../types/network.types.js';

export const handleWSConnection = (
  connection: WebSocket,
  req: IncomingMessage,
  app: FastifyInstance) => {

  const user = (req.socket as any)._user as User;

  const ws = connection as WSConnection;
  ws.userId = user.userId;
  ws.username = user.username;
  ws.userAlias = user.userAlias;
  ws.currentGameId = undefined;
  ws.lastPing = Date.now();
  ws.lastPong = Date.now();
  ws.authenticated = true;
  ws.isReconnecting = false;
  ws.networkQuality = NETWORK_GUALITY.GOOD;
  ws.latency = 0;
  ws.missedPings = 0;

  const remoteIp = req.socket.remoteAddress || 'unknown';
  app.log.info(`[${ws.userId}] WebSocket connected from ${remoteIp}`);

  app.connectionService.addConnection(ws);

  ws.on('message', async (message: string) => {
    app.log.info(`[${ws.userId}] Received: ${message}`);
    try {
      const parsedMessage = await JSON.parse(message.toString());
      const { event, payload } = parsedMessage;
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
    app.networkService.handlePong(ws.userId);
  });

  ws.on('close', (code: number, reason: any) => {
    app.log.info(`[${ws.userId}] WebSocket connection closed. ${code}: ${reason.toString()}`);
    const {userId} = ws;
    const conn = app.connectionService.getConnection(userId);
    if (!conn) {
      return;
    }

    if (conn.currentGameId !== undefined) {
      app.networkService.handlePlayerDisconnect(userId, conn.currentGameId);
    }

    if (code !== 1000) {
      app.reconnectionService.handleDisconnect(ws.userId);
    }
    app.connectionService.removeConnection(ws);
  });

  ws.on('error', (err: any) => {
    app.log.error(`[${ws.userId}] WebSocket error: ${err.message}`);
    // TODO: pause the game
  });
};
