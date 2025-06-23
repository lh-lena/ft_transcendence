import { buildServer } from './utils/app.js';

const start = async () => {
  const server = buildServer();

  const port = process.env.WS_PORT ? Number(process.env.WS_PORT) : 8081;
  const host = process.env.WS_HOST || '0.0.0.0';
  server.listen({ port, host }, function (err, address) {
    if (err) {
      server.log.error('Failed to start server:', err);
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
