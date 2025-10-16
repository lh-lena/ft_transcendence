import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { FastifyInstance } from 'fastify';
import { JwTReturnSchema } from '../schemas/jwt';
import type { JwTReturnType } from '../schemas/jwt';

/**
 * JWT Authentication Plugin
 *
 * Registers two JWT namespaces (access and refresh) with different expiration times.
 * Provides helper methods for token generation and verification with Zod validation.
 *
 * @requires config - Depends on config plugin for JWT secrets
 * @decorates {function} generateAccessToken - Creates a 15-minute access token
 * @decorates {function} verifyAccessToken - Verifies and validates access token payload
 * @decorates {function} generateRefreshToken - Creates a 7-day refresh token
 * @decorates {function} verifyRefreshToken - Verifies and validates refresh token payload
 * @throws {Error} If JWT namespaces fail to load or token payload is invalid
 */
const jwtPlugin = async (fastify: FastifyInstance) => {
  // Register access token namespace with 15-minute expiration
  await fastify.register(jwt, {
    secret: fastify.config.accessSecret,
    namespace: 'access',
    sign: { expiresIn: '1m' },
  });

  // Register refresh token namespace with 7-day expiration
  await fastify.register(jwt, {
    secret: fastify.config.refreshSecret,
    namespace: 'refresh',
    sign: { expiresIn: '7d' },
  });

  if (!fastify.jwt.access || !fastify.jwt.refresh) {
    throw new Error(
      'JWT namespaces not loaded! Register @fastify/jwt in your app before this plugin.',
    );
  }

  /**
   * Generates a short-lived access token for API authentication
   * @param payload - Token payload containing user ID
   * @param payload.id - User's unique identifier
   * @returns Signed JWT access token string
   */
  fastify.decorate('generateAccessToken', (payload: { id: string }) => {
    return fastify.jwt.access.sign(payload);
  });

  /**
   * Verifies a access token for API authentication
   * @param token - Token passed by User
   * @returns Decoded and validated token payload -> userId and role
   */
  fastify.decorate('verifyAccessToken', async (token: string): Promise<JwTReturnType> => {
    try {
      const decoded = fastify.jwt.access.verify(token);

      const result = JwTReturnSchema.safeParse(decoded);

      if (!result.success) {
        fastify.log.warn('Token payload validation failed');
        throw new Error(`Invalid token payload: ${result.error.issues[0]?.message}`);
      }

      return result.data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('jwt expired')) {
        throw new Error('Access token has expired');
      }
      throw error;
    }
  });

  /**
   * Generates a long-lived access token for token refreshing
   * @param payload - Token payload containing user ID and role
   * @param payload.id - User's unique identifier
   * @returns Signed JWT refresh token string
   */
  fastify.decorate('generateRefreshToken', (payload: { id: string }) => {
    return fastify.jwt.refresh.sign(payload);
  });

  /**
   * Verifies a refresh token for API token refreshing
   * @param token - Token passed by User
   * @returns Decoded and validated token payload -> userId and role
   * @throws {Error} If token is invalid, expired, or payload schema validation fails
   */
  fastify.decorate('verifyRefreshToken', async (token: string): Promise<JwTReturnType> => {
    try {
      const decoded = fastify.jwt.access.verify(token);

      const result = JwTReturnSchema.safeParse(decoded);

      if (!result.success) {
        fastify.log.warn('Token payload validation failed');
        throw new Error(`Invalid token payload: ${result.error.issues[0]?.message}`);
      }

      return result.data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('jwt expired')) {
        throw new Error('Access token has expired');
      }
      throw error;
    }
  });
  fastify.log.info('JWT plugin registered');
};

export default fp(jwtPlugin, {
  name: 'jwt',
  dependencies: ['config'],
  fastify: '5.x',
});
