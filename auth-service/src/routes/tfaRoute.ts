/**
 * Two-Factor Authentication (2FA) Routes
 *
 * Handles TOTP-based two-factor authentication:
 * - Token refresh for session management
 * - 2FA code verification (TOTP or backup codes)
 * - 2FA setup for new enrollments
 *
 * Security features:
 * - Time-based One-Time Passwords (TOTP) via authenticator apps
 * - Backup codes for account recovery
 * - Session-based 2FA challenges
 * - Token blacklisting on logout
 *
 * @module routes/tfaRoute
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { tfaRoutesConfig } from '../config/tfaRouteConfig';

const tfaRoutes = async (server: FastifyInstance) => {
  /**
   * POST /api/refresh
   * Refreshes access token using refresh token
   *
   * Uses refresh token from HTTP-only cookie to generate new access token
   * Validates token is not blacklisted before issuing new tokens
   *
   * @requires Refresh token cookie
   * @returns 200 - New access token
   * @returns 401 - Invalid or blacklisted refresh token
   */
  server.post('/api/refresh', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, tfaRoutesConfig.refresh, server);
  });

  /**
   * POST /api/verify
   * Verifies 2FA code during login
   *
   * Accepts either TOTP code from authenticator app or backup code
   * Completes authentication and issues tokens if valid
   *
   * @requires Valid 2FA session ID
   * @body sessionId - Temporary 2FA session identifier
   * @body userId - User attempting to authenticate
   * @body type - 'totp' or 'backup'
   * @body code - 6-digit code from authenticator or backup code
   * @returns 200 - 2FA verified, authentication complete
   * @returns 400 - Invalid code or expired session
   */
  server.post('/api/verify', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, tfaRoutesConfig.verify, server);
  });

  /**
   * POST /api/tfaSetup
   * Initializes 2FA for user account
   *
   * Generates:
   * - TOTP secret key
   * - QR code for easy setup with authenticator apps
   * - Backup codes for account recovery
   *
   * User must save backup codes securely - they cannot be recovered
   *
   * @requires Authentication
   * @body userId - Must match authenticated user
   * @body type - Must be 'totp'
   * @returns 200 - Setup data (QR code, secret, backup codes)
   * @returns 400 - 2FA already enabled or invalid request
   */
  server.post('/api/tfaSetup', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, tfaRoutesConfig.setup, server);
  });
};

export default fp(tfaRoutes, {
  name: 'tfa-routes',
  dependencies: ['tfa-plugin', 'user-plugin'],
});
