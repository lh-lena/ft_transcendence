import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

const metricRoutes = async (server: FastifyInstance) => {
  const isDev = server.config.NODE_ENV === 'development';
  /**
   * Prometheus Metrics Endpoint
   *
   * Returns Prometheus-formatted metrics for monitoring.
   */
  server.get('/', {
    schema: {
      summary: 'Prometheus metrics',
      description: 'Endpoint to retrieve Prometheus metrics.',
      tags: ['monitoring'],
      response: {
        200: {
          description: 'Prometheus metrics',
          type: 'string',
        },
      },
    },
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      const metrics = await server.metrics.register.metrics();

      return reply
        .header('Content-Type', server.metrics.register.contentType)
        .code(200)
        .send(metrics);
    },
  });

  if (isDev) server.log.info('Prometheus metrics available at /api/metrics');
  else server.log.warn('Prometheus metrics endpoint is publicly accessible.');
};

export default metricRoutes;
