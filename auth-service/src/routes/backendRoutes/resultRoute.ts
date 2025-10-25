/**
 * Game Result & Statistics Routes
 *
 * Manages game outcomes and player statistics:
 * - Global leaderboard
 * - Individual player stats
 * - Match history
 *
 * Statistics tracked:
 * - Wins/Losses
 *
 * @module routes/resultRoute
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { resultRoutesConfig } from '../../config/resultRouteConfig';

const resultRoutes = async (server: FastifyInstance) => {
  /**
   * GET /api/result/leaderboard
   * Retrieves global leaderboard
   *
   * Rankings based on:
   * - Total wins
   *
   * Returns top 8 players with:
   * - Player info (username, avatar)
   * - Key statistics
   *
   * @public - No authentication required
   * @returns Array of top players
   */
  server.get('/result/leaderboard', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, resultRoutesConfig.getLeaderboard, server);
  });

  /**
   * GET /api/result/stats/:userId
   * Retrieves detailed statistics for a specific user
   *
   * Returns:
   * - Overall record (W-L)
   *
   * @param userId - User to get statistics for
   * @returns User statistics object
   * @returns 404 - User not found or no games played
   */
  server.get('/result/stats/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, resultRoutesConfig.getStats, server);
  });

  /**
   * GET /api/result
   * Retrieves match history
   *
   * Filters:
   * - By winner/loser
   * - By date range
   *
   * Users can only view:
   * - Their own matches
   *
   * @requires Authentication for private matches
   * @query winnerId - Optional: filter by winner
   * @query loserId - Optional: filter by loser
   * @returns Array of game result objects
   */
  server.get('/result', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, resultRoutesConfig.getResult, server);
  });
};

export default resultRoutes;
