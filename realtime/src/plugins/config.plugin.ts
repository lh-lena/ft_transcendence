import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import type { EnvironmentConfig } from '../config/config.js';
import { parseConfig } from '../config/server.config.js';
import { processErrorLog } from '../utils/error.handler.js';

const plugin: FastifyPluginCallback = (app: FastifyInstance) => {
  try {
    const config: EnvironmentConfig = parseConfig();
    app.decorate('config', config);
  } catch (error: unknown) {
    processErrorLog(app, 'config-plugin', '', error);
  }
};

export const configPlugin = fp(plugin, {
  name: 'config-plugin',
});
