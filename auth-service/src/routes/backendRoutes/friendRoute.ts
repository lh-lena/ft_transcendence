/**
 * Friend Relationship Routes
 *
 * Manages friend connections between users:
 * - View friend list
 * - create friendships
 * - Remove friendships
 *
 * Friend system features:
 * - See when friends are online
 * - Game invitations
 *
 * @module routes/friendRoute
 */
import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { friendRoutesConfig } from '../../config/friendRouteConfig';

const friendRoutes = async (server: FastifyInstance) => {
  /**
   * GET /api/friend
   * Retrieves friend list
   *
   * @requires Authentication
   * @query userId - Must match authenticated user ID
   * @query status - Optional: 'accepted', 'pending', 'sent'
   * @returns Array of friend relationships
   */
  server.get('/api/friend', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, friendRoutesConfig.getFriend, server);
  });

  /**
   * POST /api/friend
   * create a freindship
   *
   * Validation:
   * - Cannot friend yourself
   *
   * @requires Authentication
   * @body userId - Must match authenticated user ID
   * @body friendId - User to befriend
   * @returns 201 - Friend request sent or accepted
   * @returns 409 - Already friends or request pending
   */
  server.post('/api/friend', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, friendRoutesConfig.createFriend, server);
  });

  /**
   * DELETE /api/friend/:friendId
   * Removes a friendship
   *
   * Can be used to:
   * - Unfriend an existing friend
   *
   * @requires Authentication & Ownership
   * @param friendId - Friendship ID to remove
   * @returns 204 - Friendship removed successfully
   */
  server.delete('/api/friend/:friendId', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, friendRoutesConfig.deleteFriend, server);
  });
};

export default fp(friendRoutes, {
  name: 'friend-routes',
  dependencies: ['route-handler', 'auth-middleware'],
});
