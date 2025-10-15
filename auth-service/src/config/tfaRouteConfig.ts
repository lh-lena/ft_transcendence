import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { isBlacklistedToken } from '../utils/blacklistToken';
import { tfaVerifySchema, tfaSetupSchema } from '../schemas/tfa';
import type { TfaVerifyType, TfaSetupType } from '../schemas/tfa';
import type { UserType } from '../schemas/user';

export const tfaRoutesConfig = {
  refresh: {
    method: 'post' as const,
    customHandler: async (req: FastifyRequest, reply: FastifyReply, server: FastifyInstance) => {
      const refreshToken = req.cookies.refreshToken;
      console.log(refreshToken);

      if (!refreshToken) {
        return reply.status(400).send({ message: 'No refresh token provided' });
      }

      if (await isBlacklistedToken(refreshToken)) {
        console.log('Refresh token is blacklisted');
        return reply.status(401).send({ message: 'refresh token expired' });
      }

      try {
        const payload = await server.verifyRefreshToken(refreshToken);
        console.log('payload:', payload);

        await reply.setAuthCookies(payload);

        return reply.doSending({
          code: 200,
          message: 'Accesstokens refreshed',
          authData: true,
        });
      } catch {
        return reply.status(401).send({ message: 'refresh token expired' });
      }
    },
    skipApiCall: true,
  },

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
      if (!user) return reply.code(404).send({ message: 'User not found' });

      let result: string;
      if (parsedData.body.type === 'totp') {
        result = await server.tfa.checkTotp(parsedData.body, user);
      } else if (parsedData.body.type === 'backup') {
        result = await server.tfa.checkBackup(parsedData.body, user);
      } else {
        result = 'Invalid 2FA type';
      }

      if (result === 'valid') {
        return reply.doSending({
          code: 200,
          message: '2FA verification successfull',
          includeAuth: true,
          userId: user.userId,
        });
      }
      return reply.code(400).send({ message: result });
    },
    skipApiCall: true,
    errorMessages: {
      invalidBody: 'Invalid 2FA verification data',
    },
  },

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
        return reply.code(404).send({ message: 'User not found' });
      }
      if (user.tfaEnabled) {
        return reply.code(400).send({ message: '2FA already enabled' });
      }

      if (parsedData.body.type !== 'totp') {
        return reply.code(400).send({ message: 'Invalid 2FA type' });
      }

      const tfaData = await server.tfa.setupTotp(user);

      return reply.doSending({
        code: 200,
        message:
          'TOTP setup completed. \
            DO NOT lose your Backup Codes! \
            Without it you could lose account access!',
        data: tfaData,
      });
    },
    skipApiCall: true,
    errorMessages: {
      invalidBody: 'Invalid 2FA setup data',
    },
  },
};
