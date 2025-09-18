import type { WebSocketServer } from 'ws';
import type { FastifyInstance } from 'fastify';
import { processErrorLog } from './error.handler.js';
import type { ConnectionService } from '../websocket/types/ws.types.js';
import type { GameSessionService } from '../game/types/game.js';

export function setupGracefulShutdown(wss: WebSocketServer, app: FastifyInstance): void {
  let shutdownInProgress = false;
  const { log } = app;
  const gracefulShutdown = async (signal: string): Promise<void> => {
    if (shutdownInProgress) {
      log.warn(`${signal} received but shutdown already in progress - ignoring`);
      return;
    }
    const connectionService = app.connectionService as ConnectionService;
    const gameSessionService = app.gameSessionService as GameSessionService;
    shutdownInProgress = true;
    log.info(` ${signal} received - initiating graceful shutdown...`);
    try {
      log.info('Closing WebSocket server...');
      wss.close();
      log.info('Notifying clients of shutdown...');
      await connectionService.notifyShutdown();
      log.info('Stopping new connection acceptance...');
      app.server.close();
      log.info('Shutting down game sessions...');
      await gameSessionService.shutdown();
      log.info('Waiting for final API calls to complete...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      log.info('Closing WebSocket connections...');
      await connectionService.shutdown();
      log.info('Closing Fastify instance...');
      await app.close();
      log.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error: unknown) {
      shutdownInProgress = false;
      processErrorLog(app, 'shutdown', 'Error during graceful shutdown', error);
      process.exit(1);
    }
  };

  process.once('SIGINT', () => void gracefulShutdown('SIGINT'));
  process.once('SIGTERM', () => void gracefulShutdown('SIGTERM'));
  process.once('SIGHUP', () => void gracefulShutdown('SIGHUP'));
}
