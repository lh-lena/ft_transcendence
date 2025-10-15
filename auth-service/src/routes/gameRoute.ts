import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { handleRoute } from '../utils/routeHandler';
import { gameRoutesConfig } from '../config/gameRouteConfig';

const gameRoutes = async (server: FastifyInstance) => {
  server.get('/api/game/:gameId', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, gameRoutesConfig.getGame, server);
  });

  server.post('/api/game', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, gameRoutesConfig.createGame, server);
  });

  server.post('/api/game/join', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, gameRoutesConfig.joinGame, server);
  });

  server.delete('/api/game/:gameId', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, gameRoutesConfig.deleteGame, server);
  });
};

export default fp(gameRoutes);
