import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { handleRoute } from '../utils/routeHandler';
import { friendRoutesConfig } from '../config/friendRouteConfig';

const friendRoutes = async (server: FastifyInstance) => {
  server.get('/api/friend', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, friendRoutesConfig.getFriend, server);
  });

  server.post('/api/friend', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, friendRoutesConfig.createFriend, server);
  });

  server.delete('/api/friend/:friendId', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, friendRoutesConfig.deleteFriend, server);
  });
};

export default fp(friendRoutes);
