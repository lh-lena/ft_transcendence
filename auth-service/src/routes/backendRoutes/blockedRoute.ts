/**
 * Blocked Users Routes
 *
 * Manages user blocking functionality for privacy and safety:
 * - View list of blocked users
 * - Block a user (prevents messaging, game invites)
 * - Unblock a user
 *
 * All operations require authentication and ownership verification
 * Users can only manage their own block list
 *
 * @module routes/blockedRoute
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { blockedRoutesConfig } from '../../config/blockedRouteConfig';

const blockedRoutes = async (server: FastifyInstance) => {
  /**
   * GET /api/blocked
   * Retrieves list of users blocked by authenticated user
   *
   * @requires Authentication
   * @query userId - Must match authenticated user ID
   * @returns Array of blocked user relationships
   */
  server.get('/api/blocked', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, blockedRoutesConfig.getBlocked, server);
  });

  /**
   * POST /api/blocked
   * Blocks a user
   *
   * Effects:
   * - Prevents direct messages
   * - Blocks game invites
   *
   * @requires Authentication
   * @body userId - Must match authenticated user ID (blocker)
   * @body blockedUserId - User to block
   * @returns 201 - Block created successfully
   */
  server.post('/api/blocked', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, blockedRoutesConfig.createBlocked, server);
  });

  /**
   * DELETE /api/blocked/:blockedId
   * Unblocks a user
   *
   * @requires Authentication & Ownership
   * @param blockedId - Block relationship ID to remove
   * @returns 204 - Block removed successfully
   */
  server.delete('/api/blocked/:blockedId', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, blockedRoutesConfig.deleteBlocked, server);
  });
};

export default blockedRoutes;
