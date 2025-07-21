import { FastifyInstance, WSConnection } from 'fastify';
import type { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { NETWORK_QUALITY } from '../types/network.types.js';
import { WsClientMessageSchema } from '../schemas/ws.schema.js';
import { User } from '../schemas/user.schema.js';
import { GameError } from '../utils/game.error.js';
import { NotificationType } from '../types/game.types.js';

export const handleWSConnection = (
  connection: WebSocket,
  req: IncomingMessage,
  app: FastifyInstance) => {

  const user = (req.socket as any)._user as User;

  const ws = connection as WSConnection;
  ws.user = user;
  ws.gameId = null;
  ws.lastPing = Date.now();
  ws.lastPong = Date.now();
  ws.authenticated = true;
  ws.networkQuality = NETWORK_QUALITY.GOOD;
  ws.latency = 0;
  ws.missedPings = 0;

  const { userId } = ws.user;
  app.log.debug(`[websocket-service] User ${userId} connected from ${req.socket.remoteAddress || 'unknown'}`);
  app.connectionService.handleNewConnection(ws);

  ws.on('message', async (message: string) => {
    try {
      const { user } = ws;
      const rawMessage = await JSON.parse(message.toString());
      const validationResult = WsClientMessageSchema.safeParse(rawMessage);
      if (!validationResult.success) {
        throw new Error(validationResult.error.issues.map(issue => issue.message).join(', '));
      }
      const { event, payload } = validationResult.data;
      app.eventBus.emit(event, { user, payload });
    } catch (error) {
      if (error instanceof SyntaxError) {
        app.log.error(`[websocket-service] Invalid JSON message from user ${userId}: ${message}`);
        app.respond.error(userId, `Invalid JSON format: ${error.message}`);
      } else if (error instanceof Error) {
        app.log.error(`[websocket-service] Error processing message from user ${userId}: ${error.message}`);
        app.respond.error(userId, `Error processing message: ${error.message}`);
      } else if (error instanceof GameError) {
        app.log.error(`[websocket-service] Game error for user ${userId}: ${error.message}`);
        app.respond.notification(userId, NotificationType.ERROR,`${error.message}`);
      }
      else {
        app.log.error(`[websocket-service] Unknown error for user ${userId}: ${error}`);
        app.respond.error(userId, 'Unknown error occurred');
      }
    }
  });

  ws.on('pong', () => {
    app.connectionService.handlePong(userId);
  });

  ws.on('close', (code: number, reason: Buffer) => {
    app.log.info(`[websocket-service] Handling closing connection for user ${userId} ${ws.user.username}. ${code}: ${reason.toString()}`);
    app.connectionService.removeConnection(ws);
    
  });

  ws.on('error', (err: any) => {
    app.log.error(`[websocket-service] WebSocket ${userId} error: ${err.message}`);
    app.connectionService.removeConnection(ws);
  });
};
