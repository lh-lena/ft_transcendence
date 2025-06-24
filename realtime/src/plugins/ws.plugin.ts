import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { handleWSConnection } from '../controllers/ws.controller.js';
import createWSService from '../services/ws.service.js';
import connectionService from '../services/connection.service.js';
import networkMonitorService from '../services/network.service.js';
import reconnectionService from '../services/reconnection.service.js';

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
  const connService = connectionService(app);
  const networkService = networkMonitorService(app);
  const reconnService = reconnectionService(app);

  app.decorate('wss', wss);
  app.decorate('wsService', wsService);
  app.decorate('networkService', networkService);
  app.decorate('connectionService', connService);
  app.decorate('reconnectionService', reconnService);

  wss.on('connection', (ws, req: IncomingMessage ) => {
    handleWSConnection(ws, req, app);
  });

  app.addHook('onClose', async () => {
    app.log.info('Shutting down WebSocket server...');
    await connService.shutdown();
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
  });

  const gracefulShutdown = async (signal: string) => {
    app.log.info(`${signal} received - initiating graceful shutdown...`);

    try {
      await connService.shutdown();
      await app.close();
      app.log.info('HTTP server closed');
      process.exit(0);
    } catch (error) {
      app.log.error(`Error during shutdown: ${error}`);
      process.exit(1);
    }
  };

  process.once('SIGINT', () => gracefulShutdown('SIGINT'));
  process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

export const websocketPlugin = fp(wsPlugin, {
  name: 'websocket-plugin',
  dependencies: ['auth-plugin', 'config-plugin']
});
