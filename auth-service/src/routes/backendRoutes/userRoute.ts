import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { handleRoute } from '../../utils/routeHandler';
import { userRoutesConfig } from '../../config/userRouteConfig';

const userRoutes = async (server: FastifyInstance) => {
  server.get('/api/user', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, userRoutesConfig.getUsers, server);
  });

  server.patch('/api/user/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, userRoutesConfig.updateUser, server);
  });

  server.delete('/api/user/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, userRoutesConfig.deleteUser, server);
  });

  server.get('/api/user/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, userRoutesConfig.getUser, server);
  });
};

export default fp(userRoutes);
