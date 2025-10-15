import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { handleRoute } from '../utils/routeHandler';
import { authRoutesConfig } from '../config/authRouteConfig';

const authRoutes = async (server: FastifyInstance) => {
  server.post('/api/register', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, authRoutesConfig.register, server);
  });

  server.post('/api/login', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, authRoutesConfig.login, server);
  });

  server.post('/api/logout', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, authRoutesConfig.logout, server);
  });

  server.post('/api/guest/login', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, authRoutesConfig.guestLogin, server);
  });

  server.get('/api/auth/me', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, authRoutesConfig.authMe, server);
  });
};

export default fp(authRoutes);
