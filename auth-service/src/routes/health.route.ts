import fp from 'fastify-plugin';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { register, authServiceHealth } from '../server';

const healthRoute = async (server: FastifyInstance) => {
  server.get('/api/auth/health', async () => {
    authServiceHealth.set(1);

    return {
      status: 'ok',
      service: 'auth-service',
      message: 'Auth service running on port 8082',
      timestamp: new Date().toISOString(),
    };
  });

  server.get('/metrics', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const metrics = await register.metrics();
      reply.header('Content-Type', register.contentType).code(200).send(metrics);
    } catch (err) {
      server.log.error('Error generating metrics:');
      reply.code(500).send({ error: 'Failed to generate metrics' });
    }
  });
};

export default fp(healthRoute);
