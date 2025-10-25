/**
 * Health Check and Metrics Routes
 *
 * Provides health check and Prometheus metrics endpoints.
 *
 * Endpoints:
 * - GET /api/health - Health check with database status
 * - GET /metrics - Prometheus metrics (development/monitoring only)
 *
 * Features:
 * - Database connectivity check
 * - Prometheus metrics collection
 * - Request duration tracking
 * - Service health indicators
 *
 * Security:
 * - Metrics endpoint should be restricted in production
 * - Consider moving to internal port or adding authentication
 *
 * @module routes/health
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/**
 * Health and Metrics Routes Plugin
 *
 * Registers health check and Prometheus metrics endpoints.
 * Creates isolated metrics registry per plugin instance.
 *
 * @param server - Fastify server instance
 */
const healthRoute = async (server: FastifyInstance) => {
  /**
   * Health Check Endpoint
   *
   * Returns service health status and database connectivity.
   * Updates Prometheus metrics for monitoring.
   *
   * Response includes:
   * - status: Overall service status
   * - service: Service identifier
   * - timestamp: Current timestamp
   * - dbStatus: Database connection status (up/down/unreachable)
   */
  server.get('/', {
    schema: {
      summary: 'Health check',
      description: 'Endpoint to get health metrics and database connectivity status',
      tags: ['health'],
      response: {
        200: { $ref: 'healthCheck' },
        500: { $ref: 'InternalError' },
      },
    },
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      const startTime = Date.now();

      const isHealthy = await server.checkDatabaseHealth();

      const dbStatusCode = isHealthy ? 1 : 0;
      const statusCode = isHealthy ? 200 : 500;

      server.metrics.dbConnectionStatus.set(dbStatusCode);
      server.metrics.backendServiceHealth.set(dbStatusCode);

      server.metrics.httpRequestDuration.observe(
        { method: 'GET', route: '/api/health', status_code: String(statusCode) },
        (Date.now() - startTime) / 1000,
      );

      const healthStatus = {
        status: isHealthy ? 'ok' : 'degraded',
        service: 'backend',
        timestamp: new Date().toISOString(),
        dbStatus: isHealthy ? 'up' : 'down',
      };

      return reply.code(statusCode).send(healthStatus);
    },
  });
};

export default healthRoute;
