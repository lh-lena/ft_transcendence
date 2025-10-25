/**
 * User Profile Routes
 *
 * Manages user accounts and profiles:
 * - View user profiles (public and private data)
 * - Search users
 * - Update profile information
 * - Delete account
 *
 * Privacy levels:
 * - Own profile: Full data
 * - Other users: Public data only (username, avatar, stats)
 * - Guests: Minimal data (username, avatar)
 *
 * @module routes/userRoute
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { userRoutesConfig } from '../../config/userRouteConfig';

const userRoutes = async (server: FastifyInstance) => {
  /**
   * GET /api/user
   * Searches or lists users
   *
   * Search filters:
   * - Username (partial match)
   *
   * Returns public profile data only
   *
   * @query username - Optional: search by username
   * @query everything else
   * @returns Array of user info objects
   */
  server.get('/user', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, userRoutesConfig.getUsers, server);
  });

  /**
   * GET /api/user/:userId
   * Retrieves specific user profile
   *
   * Response varies by relationship:
   * - Own profile: Full data
   * - Other user: Public data
   * - Guest account: Minimal data
   *
   * @param userId - User ID to retrieve
   * @returns User profile object (schema varies by access level)
   * @returns 404 - User not found
   */

  server.get('/user/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, userRoutesConfig.getUser, server);
  });

  /**
   * PATCH /api/user/:userId
   * Updates user profile
   *
   * Updatable fields:
   * - Username (must be unique)
   * - Password (automatically hashed)
   * - Avatar
   *
   * Cannot update:
   * - userId
   * - createdAt
   * - Statistics
   *
   * @requires Authentication & Ownership
   * @param userId - Must match authenticated user ID
   * @body Partial user object with fields to update
   * @returns 200 - Updated user profile
   * @returns 409 - Username already taken
   */
  server.patch('/user/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, userRoutesConfig.updateUser, server);
  });

  /**
   * DELETE /api/user/:userId
   * Permanently deletes user account
   *
   * Consequences:
   * - All user data deleted
   * - Removed from friend lists
   * - All sessions invalidated
   * - Cannot be undone
   *
   * @requires Authentication & Ownership
   * @param userId - Must match authenticated user ID
   * @returns 204 - Account deleted successfully
   */
  server.delete('/user/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, userRoutesConfig.deleteUser, server);
  });
};

export default userRoutes;
