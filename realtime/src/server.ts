import { buildServer } from './utils/app.js';
import { serverConfig } from './config/server.config.js';

const start = async () => {
  const server = buildServer();

  const port = serverConfig.port;
  const host = serverConfig.host;
  server.listen({ port, host }, function (err, address) {
    if (err) {
      server.log.error(err, 'Failed to start server:');
      process.exit(1)
    }
    server.log.info(`WebSocket server listening on ${address}`)
  });

  const gracefulShutdown = async (signal: string) => {
  await server.ready();
  await server.close();
    server.log.info('HTTP server closed');
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

};

start();
