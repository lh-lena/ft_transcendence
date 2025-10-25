/**
 * Real-time Service Plugin
 *
 * Decorates server with real-time communication service
 */

import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { RealtimeService } from '../utils/realtime';

const realtimePlugin: FastifyPluginAsync = async (server) => {
  const realtimeService = new RealtimeService(server);

  server.decorate('realtime', realtimeService);

  const isHealthy = await realtimeService.checkHealth();

  if (isHealthy) {
    server.log.info('Real-time service is healthy');
  } else {
    server.log.warn('Real-time service is not responding (will retry on demand)');
  }
};

export default fp(realtimePlugin, {
  name: 'realtime',
  fastify: '5.x',
  dependencies: ['config'],
});
