/**
 * Authentication Routes
 *
 * Handles user authentication flows including:
 * - User registration with email/password
 * - User login with credential verification
 * - User logout with token invalidation
 * - Guest login for anonymous access
 * - Token verification endpoint
 *
 * All routes use the centralized server.routeHandler utility for:
 * - Request validation
 * - Response serialization
 * - Error handling
 * - Logging
 *
 * @module routes/authRoute
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authRoutesConfig } from '../config/authRouteConfig';

const authRoutes = async (server: FastifyInstance) => {
  // ============ Public Authentication Endpoints ============

  /**
   * POST /api/register
   * Creates new user account with email and password
   * @public
   */
  server.post('/register', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, authRoutesConfig.register, server);
  });

  /**
   * POST /api/login
   * Authenticates user credentials
   * Returns 2FA challenge if enabled, otherwise returns auth tokens
   * @public
   */
  server.post('/login', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, authRoutesConfig.login, server);
  });

  /**
   * POST /api/guest/login
   * Creates temporary guest account for anonymous users
   * Guest accounts have limited permissions and expire after session
   * @public
   */
  server.post('/logout', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, authRoutesConfig.logout, server);
  });

  // ============ Authenticated Endpoints ============

  /**
   * POST /api/logout
   * Invalidates user session and tokens
   * Blacklists refresh token and updates user online status
   * @requires Authentication
   */
  server.post('/guest/login', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, authRoutesConfig.guestLogin, server);
  });

  /**
   * GET /api/auth/me
   * Verifies access token and returns authenticated user ID
   * Used by frontend to check authentication status
   * @requires Authorization header with Bearer token
   */
  server.get('/auth/me', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, authRoutesConfig.authMe, server);
  });
};

export default authRoutes;
