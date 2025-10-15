import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { handleRoute } from '../../utils/routeHandler';
import { blockedRoutesConfig } from '../../config/blockedRouteConfig';

const blockedRoutes = async (server: FastifyInstance) => {
  server.get('/api/blocked', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, blockedRoutesConfig.getBlocked, server);
  });

  server.post('/api/blocked', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, blockedRoutesConfig.createBlocked, server);
  });

  server.delete('/api/blocked/:blockedId', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, blockedRoutesConfig.deleteBlocked, server);
  });
};

export default fp(blockedRoutes);
