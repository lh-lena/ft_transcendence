import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { healthController } from '../metrics/health.controller.js';

async function monitoringPlugin(server: FastifyInstance): Promise<void> {
  // register health and metrics endpoints
  await healthController(server);

  server.log.info('Monitoring plugin registered');
}

export default fp(monitoringPlugin, {
  name: 'monitoring-plugin',
});
