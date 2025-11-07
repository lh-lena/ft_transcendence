import fp from 'fastify-plugin';
import { WebSocketServer } from 'ws';
import type { FastifyInstance, FastifyPluginCallback, VerifyClientInfo } from 'fastify';
import type { IncomingMessage } from 'http';
import type { AuthService } from '../auth/auth.types.js';
import createConnectionService from '../websocket/services/connection.service.js';
import createRespondService from '../websocket/services/respond.service.js';
import { handleWSConnection } from '../websocket/controllers/ws.controller.js';
import { setupGracefulShutdown } from '../utils/shutdown.service.js';
import { HTTPStatusCode, WSStatusCode } from '../constants/status.constants.js';
import { processErrorLog } from '../utils/error.handler.js';

const wsPlugin: FastifyPluginCallback = (app: FastifyInstance): void => {
  const wss = new WebSocketServer({
    server: app.server,
    path: '/ws',
    maxPayload: 1024 * 1024,
    verifyClient: (info, done): void => verifyWebSocketClient(info, done, app),
  });

  const respondService = createRespondService(app);
  const connService = createConnectionService(app);

  app.decorate('wss', wss);
  app.decorate('respond', respondService);
  app.decorate('connectionService', connService);

  setupWebSocketHandlers(wss, app);
  setupGracefulShutdown(wss, app);
};

function verifyWebSocketClient(
  info: VerifyClientInfo,
  done: (result: boolean, code?: number, message?: string) => void,
  app: FastifyInstance,
): void {
  app.log.debug(
    `Starting WebSocket client verification. Origin: ${info.origin}. Secure: ${info.secure}`,
  );

  const auth = app.auth as AuthService;

  auth
    .verifyClient(info)
    .then((isVerified: boolean) => {
      if (isVerified) {
        app.log.info(`Client verification successful. Origin: ${info.origin}`);
        done(true);
      } else {
        app.log.error(`Client verification failed. Origin: ${info.origin}`);
        done(false, HTTPStatusCode.UNAUTHORIZED.code, HTTPStatusCode.UNAUTHORIZED.reason);
      }
    })
    .catch((error: Error) => {
      processErrorLog(app, 'ws-plugin', 'Client verification error', error);
      done(
        false,
        HTTPStatusCode.INTERNAL_SERVER_ERROR.code,
        HTTPStatusCode.INTERNAL_SERVER_ERROR.reason,
      );
    });
}

function setupWebSocketHandlers(wss: WebSocketServer, app: FastifyInstance): void {
  wss.on('connection', (ws, req: IncomingMessage) => {
    try {
      handleWSConnection(ws, req, app);
    } catch (error) {
      processErrorLog(app, 'ws-plugin', 'Error handling WebSocket connection: ', error);
      ws.close(WSStatusCode.INTERNAL_SERVER_ERROR.code, WSStatusCode.INTERNAL_SERVER_ERROR.reason);
    }
  });
}

export const websocketPlugin = fp(wsPlugin, {
  name: 'websocket-plugin',
  dependencies: ['auth-plugin', 'config-plugin', 'event-bus-plugin'],
});
