import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { routeHandler } from '../utils/routeHandler';

/**
 * Route Handler Plugin
 *
 * Decorates Fastify instance with Route handler.
 *
 * Features:
 * - executes routes depending on config file in config folder
 *
 * @decorates {function} routeHandler
 */
const routeHandlerPlugin = async (fastify: FastifyInstance) => {
  fastify.decorate('routeHandler', routeHandler);
  fastify.log.info('route Handler plugin loaded');
};

export default fp(routeHandlerPlugin, {
  name: 'route-handler',
  fastify: '5.x',
});
