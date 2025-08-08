import Fastify from 'fastify';
import { serverConfig } from '../config/server.config.js';
import { registerPlugins } from '../plugins/index.js';
import { fetchStartGame } from './fetchStartGame.js';  

export const buildServer = () => {
  const server = Fastify({
    logger: serverConfig.logger,
  });

  server.register(registerPlugins);

  server.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      service: 'realtime',
      websocket: 'ready',
      timestamp: new Date().toISOString(),
    };
  });

  fetchStartGame(server);

  return server;
};
