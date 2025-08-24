import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { metricsService } from '../services/metrics.service.js';

export async function healthController(server: FastifyInstance) {
  // health check endpoint
  server.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const healthStatus = {
        status: 'ok',
        service: 'realtime',
        timestamp: new Date().toISOString(),
        websocket: 'operational',
      };

      // update health metric
      metricsService.serviceHealthGauge.set(1);

      return reply.code(200).send(healthStatus);
    } catch (error) {
      metricsService.serviceHealthGauge.set(0);
      return reply.code(503).send({
        status: 'error',
        service: 'realtime',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Prometheus metrics endpoint
  server.get('/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const metrics = await metricsService.getMetrics();
      return reply.header('Content-Type', metricsService.getContentType()).code(200).send(metrics);
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to retrieve metrics' });
    }
  });
}
