import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { handleRoute } from '../utils/routeHandler';
import { chatRoutesConfig } from '../config/chatRouteConfig';

const chatRoutes = async (server: FastifyInstance) => {
  server.get('/api/chat/overview/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, chatRoutesConfig.getOverview, server);
  });

  server.get('/api/chat', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, chatRoutesConfig.getChats, server);
  });

  server.post('/api/chat', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, chatRoutesConfig.createChat, server);
  });
};

export default fp(chatRoutes);
