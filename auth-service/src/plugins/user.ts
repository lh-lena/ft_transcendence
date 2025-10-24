import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { userActions } from '../utils/user';

/**
 * User Actions Plugin
 *
 * Provides helper methods for user-related operations such as
 * fetching profiles, updating settings, and managing accounts.
 *
 * @requires api-client - Depends on API client for backend communication
 * @decorates {object} user - User action handler functions
 */
const userActionsPlugin = async (fastify: FastifyInstance) => {
  // Initialize user actions with Fastify context
  const userInstance = userActions(fastify);

  // Validate userActions returned valid object
  if (!userInstance || typeof userInstance !== 'object') {
    throw new Error('userActions failed to initialize');
  }

  fastify.decorate('user', userInstance);
  fastify.log.info('User actions plugin loaded');
};

export default fp(userActionsPlugin, {
  name: 'user-plugin',
  dependencies: ['api-client'],
  fastify: '5.x',
});
