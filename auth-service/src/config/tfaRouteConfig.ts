import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { isBlacklistedToken } from '../utils/blacklistToken';
import { tfaVerifySchema, tfaSetupSchema } from '../schemas/tfa';
import type { TfaVerifyType, TfaSetupType } from '../schemas/tfa';
import type { UserType } from '../schemas/user';

/**
 * Two-Factor Authentication (2FA) Route Configuration
 * Handles TOTP setup, verification, and token refresh
 * Provides additional security layer for user accounts
 */
export const tfaRoutesConfig = {
  /**
   * Refresh Access Token
   * Generates new access token using valid refresh token
   * @requires Refresh token cookie
   * @returns 200 - New access tokens
   * @returns 401 - Invalid or blacklisted refresh token
   */
  refresh: {
    method: 'post' as const,
    customHandler: async (req: FastifyRequest, reply: FastifyReply, server: FastifyInstance) => {
      const refreshToken = req.cookies.refreshToken;
      server.log.debug({ refreshToken, cookies: req.cookies }, 'Refresh token:');

      if (!refreshToken) {
        return reply.status(400).send({ message: 'No refresh token provided' });
      }

      if (await isBlacklistedToken(refreshToken)) {
        server.log.warn({ token: refreshToken }, 'Attempted use of blacklisted refresh token');
        return reply.status(401).send({ message: 'Refresh token has been revoked' });
      }

      try {
        const payload = await server.verifyRefreshToken(refreshToken);

        server.log.debug({ userId: payload.id }, 'Access token refreshed successfully');

        return reply.doSending({
          code: 200,
          message: 'Access tokens refreshed',
          includeAuth: true,
          userId: payload.id,
        });
      } catch (error) {
        server.log.warn({ error }, 'Refresh token verification failed');
        return reply.status(401).send({ message: 'Invalid or expired refresh token' });
      }
    },
    skipApiCall: true,
  },

  /**
   * Verify 2FA Code
   * Validates TOTP or backup code during login
   * @requires Valid 2FA session
   * @param body.sessionId - Temporary 2FA session ID
   * @param body.userId - User being authenticated
   * @param body.type - 'totp' or 'backup'
   * @param body.code - 6-digit TOTP or backup code
   * @returns 200 - 2FA verification successful (with auth tokens)
   * @returns 400 - Invalid code or session
   */
  verify: {
    method: 'post' as const,
    bodySchema: tfaVerifySchema,
    customHandler: async (
      _req: FastifyRequest,
      reply: FastifyReply,
      server: FastifyInstance,
      parsedData: { body?: TfaVerifyType },
    ) => {
      if (!parsedData.body) {
        return reply.code(400).send({ message: 'No 2FA data provided' });
      }
      if (!(await server.tfa.validSession(parsedData.body.sessionId))) {
        return reply.code(400).send({ message: 'Invalid or expired 2FA-Session' });
      }

      const user: UserType = await server.user.getById(parsedData.body.userId);

      if (!user) {
        server.log.warn(
          { userId: parsedData.body.userId },
          'User not found during 2FA verification',
        );
        return reply.code(404).send({ message: 'User not found' });
      }

      let result: string;
      if (parsedData.body.type === 'totp') {
        result = await server.tfa.checkTotp(parsedData.body, user);
      } else if (parsedData.body.type === 'backup') {
        result = await server.tfa.checkBackup(parsedData.body, user);
      } else {
        server.log.warn({ type: parsedData.body.type }, 'Invalid 2FA type');
        return reply.code(400).send({ message: 'Invalid 2FA type' });
      }

      if (result === 'valid') {
        server.log.info({ userId: user.userId }, '2FA verification successful');

        return reply.doSending({
          code: 200,
          message: '2FA verification successfull',
          includeAuth: true,
          userId: user.userId,
        });
      }
      server.log.warn(
        { userId: user.userId, type: parsedData.body.type },
        '2FA verification failed',
      );
      return reply.code(400).send({ message: result });
    },
    skipApiCall: true,
    errorMessages: {
      invalidBody: 'Invalid 2FA verification data',
    },
  },

  /**
   * Setup 2FA
   * Initializes TOTP for a user account
   * Generates QR code and backup codes
   * @requires Authentication
   * @param body.userId - Must match authenticated user
   * @param body.type - Must be 'totp'
   * @returns 200 - Setup data (QR code, secret, backup codes)
   * @returns 400 - 2FA already enabled or invalid type
   */
  setup: {
    method: 'post' as const,
    bodySchema: tfaSetupSchema,
    customHandler: async (
      _req: FastifyRequest,
      reply: FastifyReply,
      server: FastifyInstance,
      parsedData: { body?: TfaSetupType },
    ) => {
      if (!parsedData.body) {
        return reply.code(400).send({ message: 'No 2FA data provided' });
      }

      const user = await server.user.getById(parsedData.body.userId);

      if (!user) {
        server.log.warn({ userId: parsedData.body.userId }, 'User not found during 2FA setup');
        return reply.code(404).send({ message: 'User not found' });
      }

      if (user.tfaEnabled) {
        server.log.warn({ userId: user.userId }, 'Attempted to setup 2FA when already enabled');
        return reply.code(400).send({ message: '2FA is already enabled for this account' });
      }

      if (parsedData.body.type !== 'totp') {
        server.log.warn({ type: parsedData.body.type }, 'Invalid 2FA type during setup');
        return reply.code(400).send({ message: 'Only TOTP is supported for 2FA' });
      }

      const tfaData = await server.tfa.setupTotp(user);

      server.log.info({ userId: user.userId }, '2FA setup completed');

      return reply.doSending({
        code: 200,
        message:
          'TOTP setup completed. ' +
          'DO NOT lose your Backup Codes!' +
          'Without it you could lose account access!',
        data: tfaData,
      });
    },
    skipApiCall: true,
    errorMessages: {
      invalidBody: 'Invalid 2FA setup data',
    },
  },
};
