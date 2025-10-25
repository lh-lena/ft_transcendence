import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import * as client from 'prom-client';

const metricsPlugin = async (fastify: FastifyInstance) => {
  const register = new client.Registry();

  client.collectDefaultMetrics({ register });

  const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
  });

  const dbConnectionStatus = new client.Gauge({
    name: 'db_connection_status',
    help: 'Database connection status (1 = up, 0 = down)',
    registers: [register],
  });

  const backendServiceHealth = new client.Gauge({
    name: 'backend_service_health',
    help: 'Backend service health status (1 = up, 0 = down)',
    registers: [register],
  });

  backendServiceHealth.set(1);

  fastify.decorate('metrics', {
    register,
    httpRequestDuration,
    dbConnectionStatus,
    backendServiceHealth,
  });

  if (fastify.config.ENABLE_METRICS) {
    fastify.addHook('onRequest', async (request) => {
      request.startTime = Date.now();
    });

    fastify.addHook('onResponse', async (request, reply) => {
      const duration = (Date.now() - (request.startTime || Date.now())) / 1000;

      httpRequestDuration.observe(
        {
          method: request.method,
          route: request.url,
          status_code: String(reply.statusCode),
        },
        duration,
      );
    });
  }

  fastify.log.info('Prometheus metrics initialized');
};

export default fp(metricsPlugin, {
  name: 'metrics',
  fastify: '5.x',
  dependencies: ['config'],
});
