/**
 * Health Check
 *
 * @module routes/healthRoute
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

const healthRoute = async (server: FastifyInstance) => {
  server.get('/', async (_req: FastifyRequest, reply: FastifyReply) => {
    server.metrics.authServiceHealth.set(1);

    const healthInfo = {
      status: 'ok',
      service: 'auth-service',
      message: 'Auth service running on port 8082',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    return reply.code(200).send(healthInfo);
  });
};

export default healthRoute;
