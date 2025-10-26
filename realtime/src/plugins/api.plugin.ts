import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import { setupNotificationRoutes } from '../api/routes/000_notification.routes.js';
import { setupGameRoutes } from '../api/routes/001_game.routes.js';

const plugin: FastifyPluginCallback = (app: FastifyInstance) => {
  app.register(setupNotificationRoutes, { prefix: '/api' });
  app.register(setupGameRoutes, { prefix: '/api' });
};

export const apiPlugin = fp(plugin, {
  name: 'api-plugin',
  dependencies: ['config-plugin', 'auth-plugin'],
});
