import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import authService from '../services/auth.service.js';

const plugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  const auth = authService(app);

  app.decorate('auth', auth);
};

export const authPlugin = fp(plugin, {
  name: 'auth-plugin',
  dependencies: ['config-plugin'],
});
