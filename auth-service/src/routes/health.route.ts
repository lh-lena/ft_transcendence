import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

const healthRoute = async (server: FastifyInstance) => {
  server.get('/api/health', async () => ({
    status: 'ok',
    service: 'auth-service',
    message: 'Auth service running on port 8082',
  }));
};

export default fp(healthRoute);
