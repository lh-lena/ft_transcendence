import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

import { isBlacklistedToken } from '../utils/blacklistToken';
import type { AxiosRequestConfig } from 'axios';

import { tfaVerifySchema, tfaSetupSchema } from '../schemas/tfa';

import type { UserType } from '../schemas/user';

const tfaRoutes = async (server: FastifyInstance) => {
  server.post('/api/refresh', async (req: FastifyRequest, reply: FastifyReply) => {
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
  });

  server.post('/api/verify', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = tfaVerifySchema.safeParse(req.body);

    if (!parseResult.success) {
      return reply.status(400).send({ message: parseResult.error.issues });
    }

    if (!(await server.tfa.validSession(parseResult.data.sessionId))) {
      return reply.code(400).send({ message: 'Invalid or expired 2FA-Session' });
    }

    const config: AxiosRequestConfig = {
      method: 'get',
      url: `/user/${parseResult.data.userId}`,
    };

    const user: UserType = await server.api(config);

    if (parseResult.data.type === 'totp') {
      await server.tfa.checkTotp(parseResult.data, user, reply);
    }

    if (parseResult.data.type === 'backup') {
      await server.tfa.checkBackup(parseResult.data, user, reply);
    }

    return reply.doSending({
      code: 200,
      message: '2FA verification successfull',
      authData: true,
      userId: user.userId,
    });
  });

  server.post('/api/tfaSetup', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = tfaSetupSchema.safeParse(req.body);

    if (!parseResult.success) {
      return reply.status(400).send({ message: parseResult.error.issues });
    }

    const user = await server.user.getById(parseResult.data.userId);

    if (parseResult.data.type === 'totp') {
      const tfaData = await server.tfa.setupTotp(user, reply);
      reply.doSending({
        code: 200,
        message:
          'TOTP setup completed. \
          DO NOT lose your Backup Codes! \
          Without it you could lose account access!',
        tfaData,
      });
    }
  });
};

export default fp(tfaRoutes);
