import { FastifyInstance, FastifyReply } from 'fastify';

export default async function metricsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/metrics',
    {
      schema: {
        response: {
          200: {
            type: 'string',
            description: 'Prometheus metrics in text format',
          },
        },
      },
    },
    async (_, reply: FastifyReply) => {
      try {
        const metrics = await fastify.metrics.register.metrics();
        return reply
          .header('Content-Type', fastify.metrics.register.contentType)
          .code(200)
          .send(metrics);
      } catch {
        fastify.log.error('Error generating metrics:');
        return reply.code(500).send({
          error: 'Failed to generate metrics',
          timestamp: new Date().toISOString(),
        });
      }
    },
  );

  // Optional: Add a ready endpoint for Kubernetes
  fastify.get('/ready', async (_, reply: FastifyReply) => {
    // Simple readiness check - service can accept traffic
    return reply.code(200).send({ status: 'ready' });
  });

  // Optional: Add a live endpoint for Kubernetes
  fastify.get('/live', async (_, reply: FastifyReply) => {
    // Simple liveness check - service is running
    return reply.code(200).send({ status: 'alive' });
  });
}
