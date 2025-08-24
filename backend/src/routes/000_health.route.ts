import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import * as client from 'prom-client';

const register = new client.Registry();

// default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Create custom metrics
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

const healthRoute = async (server: FastifyInstance) => {
  // Existing health check endpoint
  server.get('/api/health', {
    schema: {
      response: {
        200: { $ref: 'healthCheck' },
        500: { $ref: 'InternalError' },
      },
      summary: 'Health Check',
    },
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      const startTime = Date.now();
      let dbStatus = 'down';
      let dbStatusCode = 0;

      try {
        await server.prisma.$queryRaw`SELECT 1`;
        dbStatus = 'up';
        dbStatusCode = 1;
      } catch {
        dbStatus = 'unreachable';
        dbStatusCode = 0;
      }

      // Update metrics
      dbConnectionStatus.set(dbStatusCode);
      httpRequestDuration.observe(
        { method: 'GET', route: '/api/health', status_code: '200' },
        (Date.now() - startTime) / 1000,
      );

      const healthStatus = {
        status: 'ok',
        service: 'backend',
        timestamp: new Date().toISOString(),
        dbStatus: dbStatus,
      };

      return reply.code(200).send(healthStatus);
    },
  });

  // New Prometheus metrics endpoint
  server.get('/metrics', {
    handler: async (_, reply: FastifyReply) => {
      try {
        const metrics = await register.metrics();
        reply.header('Content-Type', register.contentType).code(200).send(metrics);
      } catch (err) {
        reply.code(500).send(err);
      }
    },
  });
};

export default fp(healthRoute);
