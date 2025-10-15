import { FastifyInstance, FastifyReply } from 'fastify';

export default async function metricsRoutes(fastify: FastifyInstance) {
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
