import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { handleRoute } from '../../utils/routeHandler';
import { resultRoutesConfig } from '../../config/resultRouteConfig';

const resultRoutes = async (server: FastifyInstance) => {
  server.get('/api/result/leaderboard', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, resultRoutesConfig.getLeaderboard, server);
  });

  server.get('/api/result/stats/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, resultRoutesConfig.getStats, server);
  });

  server.get('/api/result', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, resultRoutesConfig.getResult, server);
  });
};

export default fp(resultRoutes);
