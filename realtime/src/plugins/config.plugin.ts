import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { serverConfig } from '../config/server.config.js';

const plugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.decorate('config', serverConfig);
};

export const configPlugin = fp(plugin, {
  name: 'config-plugin',
});
