import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { handleRoute } from '../utils/routeHandler';
import { tournamentRoutesConfig } from '../config/tournamentRouteConfig';

const tournamentRoutes = async (server: FastifyInstance) => {
  server.get('/api/tournament/:tournamentId', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, tournamentRoutesConfig.getTournament, server);
  });

  server.post('/api/tournament', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, tournamentRoutesConfig.joinTournament, server);
  });

  server.post('/api/tournament/leave/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, tournamentRoutesConfig.leaveTournament, server);
  });
};

export default fp(tournamentRoutes);
