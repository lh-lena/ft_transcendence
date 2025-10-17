/**
 * Authentication PreHandler Hook
 * Enforces authentication on protected routes:
 * - Validates access tokens from cookies
 * - Attaches decoded user info to request object
 * - Bypasses authentication for public routes
 *
 * Public routes (no authentication required):
 * - Health checks and metrics
 * - OAuth callback endpoints
 * - Registration and login
 * - Token refresh
 * - Guest login
 *
 * Protected routes:
 * - All other API endpoints require valid access token
 * - Token must be present in accessToken cookie
 * - Token is verified using JWT plugin
 *
 * @module hooks/preHandlerHook
 */
import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import type { JwTReturnType } from '../schemas/jwt';

/**
 * List of routes that don't require authentication
 * Organized by category for easier maintenance
 */
const publicRoutes = {
  // Health and monitoring
  health: ['/api/auth/health', '/metrics'],

  // OAuth flows
  oauth: ['/api/oauth', '/api/oauth/callback'],

  // Authentication
  auth: [
    '/api/register',
    '/api/login',
    '/api/refresh',
    '/api/verify',
    '/api/guest/login',
    '/api/auth/me',
  ],
};

const guestRoutes = {
  tournament: ['/api/tournament', '/api/tournament/:tournamentId', '/api/tournament/leave/:userId'],
  user: ['/api/user/:userId'],
};

const publicRoutesOne = Object.values(publicRoutes).flat();
const guestRoutesOne = Object.values(guestRoutes).flat();

/**
 * Checks if a route is public (doesn't require authentication)
 *
 * @param routePath - Route path from request
 * @returns true if route is public, false if authentication required
 */
function isPublicRoute(routePath: string): boolean {
  if (publicRoutesOne.includes(routePath)) {
    return true;
  }

  return false;
}

/**
 * Checks if a route is guest (guest only allowed here)
 *
 * @param routePath - Route path from request
 * @returns true if route is allowed for guests, false if authentication required
 */
function isGuestRoute(routePath: string): boolean {
  if (guestRoutesOne.includes(routePath)) {
    return true;
  }

  return false;
}

/**
 * Track failed authentication attempts per IP
 */
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

const maxFailedAttempts = 10;
const lockoutTime = 15 * 60; // + *1000

/**
 * Checks if IP is rate limited due to too many failed auth attempts
 */
function isRateLimited(ip: string): boolean {
  const attempts = failedAttempts.get(ip);

  if (!attempts) {
    return false;
  }

  if (Date.now() > attempts.resetAt) {
    failedAttempts.delete(ip);
    return false;
  }

  return attempts.count >= maxFailedAttempts;
}

/**
 * Records a failed authentication attempt
 */
function recordFailedAttempt(ip: string): void {
  const attempts = failedAttempts.get(ip);

  if (!attempts) {
    failedAttempts.set(ip, {
      count: 1,
      resetAt: Date.now() + lockoutTime,
    });
  } else {
    attempts.count++;
  }
}

/**
 * Clears failed attempts on successful authentication
 */
function clearFailedAttempts(ip: string): void {
  failedAttempts.delete(ip);
}

export default fp(
  async function onRequestHook(server: FastifyInstance) {
    server.addHook('preHandler', async (req: FastifyRequest, reply: FastifyReply) => {
      const routePath = req.routeOptions.url || req.url;

      server.log.debug(`PreHandler Hook: Checking route ${routePath}`);

      if (!routePath) {
        server.log.warn({ url: req.url }, 'Route path not found');
        return reply.code(404).send({ error: 'Route not found' });
      }

      if (isRateLimited(req.ip)) {
        server.log.warn(
          { ip: req.ip, route: routePath },
          'Too many failed authentication attempts',
        );

        return reply.code(429).send({
          error: 'Too many requests',
          message: 'Too many failed authentication attempts. Please try again later.',
        });
      }

      if (isPublicRoute(routePath)) {
        server.log.debug({ route: routePath }, 'Public route, skipping authentication');
        return;
      }

      const token = req.cookies.accessToken;

      if (!token) {
        recordFailedAttempt(req.ip);

        server.log.warn(
          {
            route: routePath,
            method: req.method,
            ip: req.ip,
          },
          'Missing access token for protected route',
        );

        return reply.code(401).send({
          error: 'Authentication required',
          message: 'Missing access token',
        });
      }

      try {
        const decoded: JwTReturnType = await server.verifyAccessToken(token);

        if (decoded.role === 'guest' && isGuestRoute(routePath) === false) {
          recordFailedAttempt(req.ip);

          server.log.warn(
            {
              route: routePath,
              method: req.method,
              ip: req.ip,
              role: decoded.role,
            },
            `${decoded.role} user(${decoded.id} tried to access protected Route`,
          );

          return reply.code(401).send({
            error: 'Authentication required',
            message: 'Guest users are not allowed to access this route',
          });
        }

        req.user = decoded;

        clearFailedAttempts(req.ip);

        server.log.debug(
          {
            userId: decoded.id,
            userRole: decoded.role,
            route: routePath,
          },
          'User authenticated successfully',
        );
      } catch (err) {
        recordFailedAttempt(req.ip);

        server.log.warn(
          {
            err,
            route: routePath,
            ip: req.ip,
          },
          'Invalid or expired access token',
        );

        return reply.code(401).send({
          error: 'Authentication failed',
          message: 'Invalid or expired access token',
        });
      }
    });

    server.log.info('Registered auth preHandler hook');

    setInterval(
      () => {
        const now = Date.now();
        for (const [ip, attempts] of failedAttempts.entries()) {
          if (now > attempts.resetAt) {
            failedAttempts.delete(ip);
          }
        }
      },
      5 * 60 * 1000,
    );
  },
  {
    name: 'auth-middleware',
    dependencies: ['jwt', 'cookies'],
  },
);
