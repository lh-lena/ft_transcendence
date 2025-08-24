import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import { serverConfig } from '../config/server.config.js';

const plugin: FastifyPluginCallback = (app: FastifyInstance) => {
  app.decorate('config', serverConfig);
};

export const configPlugin = fp(plugin, {
  name: 'config-plugin',
});
