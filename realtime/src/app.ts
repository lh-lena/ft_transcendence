import Fastify, { type FastifyInstance } from 'fastify';
import { serverConfig } from './config/server.config.js';
import { registerPlugins } from './plugins/index.js';

export const buildServer = async (): Promise<FastifyInstance> => {
  const server = Fastify({
    logger: serverConfig.logger,
  });

  await server.register(registerPlugins);

  return server;
};
