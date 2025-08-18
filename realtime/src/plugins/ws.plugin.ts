import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync, VerifyClientInfo } from 'fastify';
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { handleWSConnection } from '../controllers/ws.controller.js';
import createWSService from '../services/ws.service.js';
import connectionService from '../services/connection.service.js';
import reconnectionService from '../services/reconnection.service.js';
import createRespondService from '../services/respond.service.js';
import { setupGracefulShutdown } from '../utils/shutdown.js';
const wsPlugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  const wss = createWebSocketServer(app);
  const wsService = createWSService(app);
  const respondService = createRespondService(app);
  const connService = connectionService(app);
  const reconnService = reconnectionService(app);

  app.decorate('wss', wss);
  app.decorate('wsService', wsService);
  app.decorate('respond', respondService);
  app.decorate('connectionService', connService);
  app.decorate('reconnectionService', reconnService);

  setupWebSocketHandlers(wss, app);
  setupGracefulShutdown(wss, app);
};

function createWebSocketServer(app: FastifyInstance): WebSocketServer {
  return new WebSocketServer({
    server: app.server,
    path: '/ws',
    verifyClient: (info, done) => verifyWebSocketClient(info, done, app),
  });
}

function verifyWebSocketClient(
  info: VerifyClientInfo,
  done: (result: boolean, code?: number, message?: string) => void,
  app: FastifyInstance,
): void {
  app.log.debug(
    `Starting WebSocket client verification. Origin: ${info.origin}. Secure: ${info.secure}`,
  );

  app.auth
    .verifyClient(info)
    .then((isVerified: boolean) => {
      if (isVerified) {
        app.log.info(`Client verification successful. Origin: ${info.origin}`);
        done(true);
      } else {
        app.log.warn(`Client verification failed. Origin: ${info.origin}.`);
        done(false, 401, 'Unauthorized');
      }
    })
    .catch((error: Error) => {
      app.log.error(`Client verification error: ${error.message}, origin: ${info.origin}`);
      done(false, 500, 'Internal Server Error');
    });
}

function setupWebSocketHandlers(
  wss: WebSocketServer,
  app: FastifyInstance,
): void {
  wss.on('connection', (ws, req: IncomingMessage) => {
    try {
      handleWSConnection(ws, req, app);
    } catch (error) {
      app.log.error(
        `Error handling WebSocket connection. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      ws.close(1011, 'Server error');
    }
  });
}

function setupFastifyHooks(wss: WebSocketServer, app: FastifyInstance) {
  // app.addHook('onClose', async () => {
  //   app.log.info('[ws-plugin] Starting cleanup sequence...');
  //   try {
  //     app.log.info('[ws-plugin] Closing WebSocket server...');
  //     await new Promise<void>((resolve) => {
  //       wss.close(() => {
  //         app.log.info('[ws-plugin] WebSocket server closed');
  //         resolve();
  //       });
  //     });
  //     app.log.info('[ws-plugin] Notifying clients of shutdown...');
  //     await app.connectionService.notifyShutdown();
  //     app.log.info('[ws-plugin] Shutting down game sessions...');
  //     await app.gameSessionService?.shutdown();
  //     app.log.info('[ws-plugin] Cleaning up reconnection service...');
  //     app.reconnectionService.cleanup?.();
  //     app.log.info('[ws-plugin] Closing all connections...');
  //     await app.connectionService.shutdown();
  //     app.log.info('[ws-plugin] All WebSocket services cleaned up successfully');
  //   } catch (error) {
  //     app.log.error('[ws-plugin] Error during cleanup:', error);
  //   }
  // });
}

export const websocketPlugin = fp(wsPlugin, {
  name: 'websocket-plugin',
  dependencies: ['auth-plugin', 'config-plugin', 'event-bus-plugin'],
});
