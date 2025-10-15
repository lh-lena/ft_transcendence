import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { apiClientBackend } from '../utils/apiClient.js';

/**
 * Backend API Client Plugin
 *
 * Decorates Fastify instance with HTTP client for communicating with backend service.
 * Uses axios with retry logic and error handling.
 *
 * Features:
 * - 5 second timeout per request
 * - Automatic retry on network errors and 400 status
 * - Centralized error logging
 *
 * @decorates {function} api - Axios-based HTTP client for backend API calls
 * @example
 * const userData = await fastify.api<User>({
 *   url: '/users/123',
 *   method: 'GET'
 * });
 */
const apiClientPlugin = async (fastify: FastifyInstance) => {
  fastify.decorate('api', apiClientBackend);
  fastify.log.info('API Client plugin loaded');
};

export default fp(apiClientPlugin, {
  name: 'api-client',
  fastify: '5.x',
});
