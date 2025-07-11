import { FastifyInstance, WSConnection } from 'fastify';
import type { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { User, ConnectionState } from '../types/game.types.js';
import { NETWORK_QUALITY } from '../types/network.types.js';
import { ErrorCode } from '../types/error.types.js';

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

  const remoteIp = req.socket.remoteAddress || 'unknown';
  const { userId } = ws.user;
  app.log.debug(`[websocket-service] User ${userId} connected from ${remoteIp}`);

  app.connectionService.addConnection(ws);
  const disconnectedInfo = app.reconnectionService.getDiconnectionData(userId);
  if (disconnectedInfo) {
    const gameId = app.reconnectionService.attemptReconnection(userId);
    if (gameId) {
      app.log.debug(`[websocket-service] User ${userId} successfully reconnected to game ${gameId}`);
      app.connectionService.updateUserGame(userId, gameId);
    } else {
      app.log.warn(`[websocket-service] User ${userId} reconnection failed`);
    }
  } else {
    app.wsService.sendToConnection(userId, {'event': 'connected', 'payload': {'userId': userId}});
  }

  ws.on('message', async (message: string) => {
    let parsedMessage: any;
    try {
      parsedMessage = await JSON.parse(message.toString());
    } catch (error) {
      app.log.error(`[websocket-service] On connection ${userId} failed to parse WebSocket message: ${error instanceof Error ? error.message : 'Unknown error'}, Message: '${message}'`);
      app.wsService.sendToConnection(userId, {
        event: 'error',
        payload: {
          message: 'Invalid JSON message format',
          code: ErrorCode.INVALID_MESSAGE
        }
      });
      return;
    }

    const { event, payload } = parsedMessage;
    
    if (!event || !payload) {
      app.wsService.sendToConnection(userId, {
        event: 'error',
        payload: { 
          message: 'Message must contain event and payload',
          code: ErrorCode.INVALID_MESSAGE
        }
      });
      return;
    }

    const { user } = ws;
    const connInfo = app.connectionService.getConnection(userId);
    if (connInfo) {
      connInfo.lastActivity = Date.now();
    }
    switch (event) {
      case 'game_create':
        await app.gameService.handleCreateGame(payload.gameId, user);
        break;

      case 'game_join':
        app.gameService.handleJoinGame(payload.gameId, user);
        break;

      case 'game_update':
        await app.gameService.handlePlayerInput(userId, payload);
        break;

      case 'game_pause':
        app.gameStateService.pauseGame(user.userId, payload.gameId, `User ${user.userAlias} requested pause`);
        break;

      case 'game_resume':
        app.gameStateService.resumeGame(user.userId, payload.gameId);
        break;

      case 'game_leave':
        app.gameService.handleGameLeave(payload.gameId, userId);
        break;

      default:
        app.log.warn(`[websocket-service] Unknown event from user ${userId}: ${event}`);
        ws.send(JSON.stringify({
          event: 'error',
          payload: {
            message: `Unknown event: ${event}`,
            code: ErrorCode.UNKNOWN_EVENT
          }
        }));
      }
  });

  ws.on('pong', () => {
    app.networkService.handlePong(userId);
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
