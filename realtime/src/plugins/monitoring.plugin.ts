import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { healthController } from '../controllers/health.controller.js';

async function monitoringPlugin(server: FastifyInstance) {
  // register health and metrics endpoints
  await healthController(server);

  server.log.info('Monitoring plugin registered');
}

export default fp(monitoringPlugin, {
  name: 'monitoring-plugin',
});
