import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import createAuthService from '../auth/auth.service.js';

const plugin: FastifyPluginCallback = (app: FastifyInstance) => {
  const auth = createAuthService(app);

  app.decorate('auth', auth);
};

export const authPlugin = fp(plugin, {
  name: 'auth-plugin',
  dependencies: ['config-plugin'],
});
