import { buildServer } from './app.js';
import type { EnvironmentConfig } from './config/config.js';
import { safeErrorToString } from './utils/error.handler.js';

const start = async (): Promise<void> => {
  const result = await buildServer();
  if (result.isErr()) {
    console.error(safeErrorToString(result.error));
    process.exit(1);
  }
  const server = result.value;
  const config = server.config as EnvironmentConfig;
  const { port, host } = config;
  server.listen({ port, host }, function (err: unknown, address: string) {
    if (err) {
      server.log.error(err, 'Failed to start server:');
      process.exit(1);
    }
    const url = new URL(address);
    const wsUrl = `${url.hostname}:${url.port}`;
    server.log.info(`WebSocket server listening on ws://${wsUrl}/ws`);
  });

  const gracefulShutdown = async (): Promise<void> => {
    await server.ready();
    await server.close();
    server.log.info('HTTP server closed');
    process.exit(0);
  };

  process.on('SIGTERM', () => void gracefulShutdown());
  process.on('SIGINT', () => void gracefulShutdown());
};

start();
