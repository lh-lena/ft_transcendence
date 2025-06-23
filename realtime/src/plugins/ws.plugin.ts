import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync, WebSocketRequest } from 'fastify';
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { handleWSConnection } from '../controllers/ws.controller.js';
import createWSService from '../services/ws.service.js';

const wsPlugin: FastifyPluginAsync = async (app: FastifyInstance) => {

  const wss = new WebSocketServer({
    server: app.server,
    path: '/ws',
    verifyClient: (info, done) => {
      app.auth.verifyClient(info)
        .then((isVerified: boolean) => {
          if (!isVerified) {
            done(false, 401, 'Unauthorized');
          } else {
            done(true);
          }
        })
        .catch((error: Error) => {
          app.log.error(`[verifyClient]: Error during verification: ${error.message}`);
          done(false, 500, 'Internal Server Error');
        });
    }
  });

  const wsService = createWSService(app);
  app.decorate('wsService', wsService);
  app.decorate('wss', wss);

  wss.on('connection', (ws, req: IncomingMessage ) => {
    handleWSConnection(ws, req, app);
  });

  app.addHook('onClose', async () => {
    app.log.info('Shutting down WebSocket server...');
    await wsService.shutdown();
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
  });

  const gracefulShutdown = async (signal: string) => {
    app.log.info(`${signal} received - initiating graceful shutdown...`);

    try {
      await wsService.shutdown();
      await app.close();
      app.log.info('HTTP server closed');
      // process.exit(0);
    } catch (err) {
      app.log.error(`Error during shutdown: ${err}`);
      process.exit(1);
    }
  };

  process.once('SIGINT', () => gracefulShutdown('SIGINT'));
  process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

export const websocketPlugin = fp(wsPlugin, {
  name: 'websocket-plugin',
  dependencies: ['auth-plugin']
});
