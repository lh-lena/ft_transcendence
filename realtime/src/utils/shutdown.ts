import { WebSocketServer } from 'ws';
import { FastifyInstance } from 'fastify';

export function setupGracefulShutdown(wss: WebSocketServer, app: FastifyInstance): void {
  let shutdownInProgress = false;
  const gracefulShutdown = async (signal: string) => {
    if (shutdownInProgress) {
      app.log.warn(`${signal} received but shutdown already in progress - ignoring`);
      return;
    }
    shutdownInProgress = true;
    app.log.info(` ${signal} received - initiating graceful shutdown...`);
    try {
      app.log.info('Closing WebSocket server...');
      wss.close();
      app.log.info('Notifying clients of shutdown...');
      await app.connectionService.notifyShutdown();
      app.log.info('Stopping new connection acceptance...');
      app.server.close();
      app.log.info('Shutting down game sessions...');
      await app.gameSessionService.shutdown();
      app.log.info('Waiting for final API calls to complete...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      app.log.info('Closing WebSocket connections...');
      await app.connectionService.shutdown();
      app.log.info('Closing Fastify instance...');
      await app.close();
      app.log.info('Graceful shutdown completed');

      if (process.env.NODE_ENV === 'development') {
        console.log('Active handles after shutdown:', (process as any)._getActiveHandles?.());
        console.log('Active requests after shutdown:', (process as any)._getActiveRequests?.());
      }
      process.exit(0);
    } catch (error) {
      app.log.error(`Error during shutdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  };

  process.once('SIGINT', () => gracefulShutdown('SIGINT'));
  process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.once('SIGHUP', () => gracefulShutdown('SIGHUP'));
  // process.on('uncaughtException', (error) => {
  //   app.log.fatal('Uncaught Exception:', error);
  //   if (!shutdownInProgress) {
  //     gracefulShutdown('UNCAUGHT_EXCEPTION');
  //   } else {
  //     process.exit(1);
  //   }
  // });

  process.on('unhandledRejection', (reason, promise) => {
    app.log.fatal('Unhandled Rejection at:', promise, 'reason:', reason);
    if (!shutdownInProgress) {
      gracefulShutdown('UNHANDLED_REJECTION');
    }
  });
}