import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { handleRoute } from '../utils/routeHandler';
import { tfaRoutesConfig } from '../config/tfaRouteConfig';

const tfaRoutes = async (server: FastifyInstance) => {
  server.post('/api/refresh', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, tfaRoutesConfig.refresh, server);
  });

  server.post('/api/verify', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, tfaRoutesConfig.verify, server);
  });

  server.post('/api/tfaSetup', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, tfaRoutesConfig.setup, server);
  });
};

export default fp(tfaRoutes);
