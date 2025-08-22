import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

const healthRoute = async (server: FastifyInstance) => {
  server.get('/api/health', {
    schema: {
      response: {
        200: { $ref: 'healthCheck' },
        500: { $ref: 'InternalError' },
      },
      summary: 'Health Check',
    },
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      let dbStatus = 'down';

      try {
        await server.prisma.$queryRaw`SELECT 1`;
        dbStatus = 'up';
      } catch {
        dbStatus = 'unreachable';
      }

      const healthStatus = {
        status: 'ok',
        service: 'backend',
        timestamp: new Date().toISOString(),
        dbStatus: dbStatus,
      };

      return reply.code(200).send(healthStatus);
    },
  });
};

export default fp(healthRoute);
