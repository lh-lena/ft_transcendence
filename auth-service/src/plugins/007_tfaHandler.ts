import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { tfaHandler } from '../utils/tfa.js';

/**
 * Two-Factor Authentication Handler Plugin
 *
 * Provides methods for managing 2FA setup, verification, and recovery codes.
 * Integrates with backend service via API client.
 *
 *  Available methods:
 * - fastify.tfa.setup: Enable 2FA for user
 * - fastify.tfa.verify: Verify 2FA code
 *
 * @requires api-client - Depends on API client for backend communication
 * @decorates {object} tfa - Two-factor authentication handler instance
 */
const tfaHandlerPlugin = async (fastify: FastifyInstance) => {
  // Validate tfaHandler class exists and is instantiable
  if (typeof tfaHandler !== 'function') {
    throw new Error('tfaHandler is not a valid constructor');
  }

  // Instantiate TFA handler with Fastify context for API access
  const tfaInstance = new tfaHandler(fastify);

  fastify.decorate('tfa', tfaInstance);
  fastify.log.info('TFA Handler plugin loaded');
};

export default fp(tfaHandlerPlugin, {
  name: 'tfa-handler',
  dependencies: ['api-client'],
  fastify: '5.x',
});
