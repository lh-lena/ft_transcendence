import { FastifyInstance, FastifyReply } from 'fastify';

export default async function metricsRoutes(fastify: FastifyInstance) {
  fastify.get('/ready', async () => {
    const checks = {
      fastify: true,
      config: !!fastify.config,
    };

    const isReady = Object.values(checks).every(Boolean);

    if (!isReady) {
      throw { statusCode: 503, message: 'Service not ready', data: checks };
    }

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks,
    };
  });

  // Optional: Add a live endpoint for Kubernetes
  fastify.get('/live', async (_, reply: FastifyReply) => {
    // Simple liveness check - service is running
    return reply.code(200).send({ status: 'alive' });
  });
}
