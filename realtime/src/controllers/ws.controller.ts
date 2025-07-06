import { FastifyInstance, WSConnection } from 'fastify';
import type { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { User, ConnectionState, StartGame, GameMode } from '../types/pong.types.js';
import { NETWORK_QUALITY } from '../types/network.types.js';

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
  ws.state = ConnectionState.CONNECTED;
  ws.gameId = null;
  ws.lastPing = Date.now();
  ws.lastPong = Date.now();
  ws.authenticated = true;
  ws.isReconnecting = false;
  ws.networkQuality = NETWORK_QUALITY.GOOD;
  ws.latency = 0;
  ws.missedPings = 0;

  const remoteIp = req.socket.remoteAddress || 'unknown';
  app.log.debug(`[websocket-service] User ${userId} connected from ${remoteIp}`);

  app.connectionService.addConnection(ws);
  const disconnectedInfo = app.reconnectionService.getDiconnectionData(userId);
  if (disconnectedInfo) {
    const gameId = app.reconnectionService.attemptReconnection(userId);
    if (gameId) {
      app.log.debug(`[websocket-service] User ${userId} successfully reconnected to game ${gameId}`);
      app.connectionService.updateUserGame(ws.userId, gameId);
    } else {
      app.log.warn(`[websocket-service] User ${userId} reconnection failed`);
    }
  } else {
    app.wsService.sendToConnection(userId, {'event': 'connected', 'payload': {userId}});
  }

  ws.on('message', async (message: string) => {
    app.log.info(`[${userId}] Received: ${message}`);
    try {
      const parsedMessage = await JSON.parse(message.toString());
      const { event, payload } = parsedMessage;
      const connInfo = app.connectionService.getConnection(userId);
      if (connInfo) {
        connInfo.lastActivity = Date.now();
      }
      app.log.debug(`[event-handling] recieved ${event} on connection ${userId}`);
      switch (event) {
        case 'game_create':
          await app.gameService.handleCreateGame(payload.gameId, user);
          break;

        case 'game_join':
          app.gameService.handleJoinGame(payload.gameId, user);
          break;

        case 'game_update':
          await app.gameService.handlePlayerInput(ws.userId, payload);
          break;

        case 'game_pause':
          app.gameStateService.pauseGame(payload.gameId, `User ${user.userAlias} requested pause`);
          break;

        case 'game_resume':
          app.gameStateService.resumeGame(payload.gameId);
          break;

        default:
          app.log.warn(`[websocket-service] Unknown event from user ${userId}: ${event}`);
          ws.send(JSON.stringify({
            event: 'error',
            payload: { error: `Unknown event: ${event}` }
          }));
      }
    } catch (error: any) {
      app.log.error(`[websocket-service] On connection ${ws.userId} failed to parse WebSocket message: ${error.message}, Message: '${message}'`);
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
    app.log.info(`[websocket-service] Handling closing connection for user ${userId} ${username}. ${code}: ${reason.toString()}`);
    app.connectionService.removeConnection(ws);
  });

  ws.on('error', (err: any) => {
    app.log.error(`[websocket-service] WebSocket ${userId} error: ${err.message}`);
    app.connectionService.removeConnection(ws);
  });
};
