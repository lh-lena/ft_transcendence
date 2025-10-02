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
      const newAccessToken = server.generateAccessToken(payload);
      const newRefreshToken = server.generateRefreshToken(payload);

      return reply
        .setAuthCookie('jwt', newAccessToken)
        .setAuthCookie('refreshToken', newRefreshToken, { path: '/api' })
        .send({ message: 'Tokens refreshed', jwt: newAccessToken });
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

    if (!user) {
      return reply.status(404).send({ message: 'User not found' });
    }

    if (parseResult.data.type === 'totp') {
      return await server.tfa.checkTotp(parseResult.data, user, reply);
    }

    if (parseResult.data.type === 'backup') {
      return await server.tfa.checkBackup(parseResult.data, user, reply);
    }

    return reply.send({ message: '2FA verified successfully' });
  });

  server.post('/api/tfaSetup', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = tfaSetupSchema.safeParse(req.body);

    if (!parseResult.success) {
      return reply.status(400).send({ message: parseResult.error.issues });
    }

    const user = await server.user.getById(parseResult.data.userId);

    if (!user) {
      return reply.status(404).send({ message: 'User not found' });
    }

    if (parseResult.data.type === 'totp') {
      return await server.tfa.setupTotp(user, reply);
    }
  });
};

export default fp(tfaRoutes);
