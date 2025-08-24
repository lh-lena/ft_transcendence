import { buildServer } from './app.js';
import { serverConfig } from './config/server.config.js';

const start = async (): Promise<void> => {
  const server = await buildServer();

  const port = serverConfig.port;
  const host = serverConfig.host;
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
