import Fastify from 'fastify';
import { serverConfig } from '../config/server.config.js';
import { registerPlugins } from '../plugins/index.js';

export const buildServer = () => {
  const server = Fastify({
    logger: serverConfig.logger
  });

  server.register(registerPlugins);

  server.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    connections: server.connectionService.getConnections.size,
  }});

  return server;
};
