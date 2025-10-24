/**
 * Tournament Routes
 *
 * Manages competitive tournament brackets:
 * - View tournament details and brackets
 * - Create new tournaments
 * - Join tournaments
 * - Leave tournaments before start
 *
 * Tournament features:
 * - Automated bracket generation
 *
 * @module routes/tournamentRoute
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { tournamentRoutesConfig } from '../../config/tournamentRouteConfig';

const tournamentRoutes = async (server: FastifyInstance) => {
  /**
   * GET /api/tournament/:tournamentId
   * Retrieves tournament details and current bracket
   *
   * Returns:
   * - Tournament info
   * - Participant list
   * - current round
   * - Tournament status
   *
   * @param tournamentId - Unique tournament identifier
   * @returns Tournament object with bracket data
   * @returns 404 - Tournament not found
   */
  server.get('/api/tournament/:tournamentId', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, tournamentRoutesConfig.getTournament, server);
  });

  /**
   * POST /api/tournament
   * Joins or Creates a new tournament
   *
   * @requires Authentication
   * @body Tournament configuration
   * @returns 201 - Tournament created successfully
   */
  server.post('/api/tournament', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, tournamentRoutesConfig.joinTournament, server);
  });

  /**
   * POST /api/tournament/leave/:userId
   * Removes user from tournament
   *
   * @requires Authentication & Ownership
   * @param userId - Must match authenticated user ID
   * @returns 200 - Successfully left tournament
   * @returns 409 - Tournament already started
   */
  server.post('/api/tournament/leave/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, tournamentRoutesConfig.leaveTournament, server);
  });
};

export default tournamentRoutes;
