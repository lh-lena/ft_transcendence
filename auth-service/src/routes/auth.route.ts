import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

import { hashPassword, verifyPassword } from '../auth/passwords';

import { isBlacklistedToken } from '../utils/blacklistToken';
import { apiClientBackend } from '../utils/apiClient';
import type { AxiosRequestConfig } from 'axios';

import { tfaVerifySchema, tfaSetupSchema } from '../schemas/tfa';
import { refreshTokenSchema } from '../schemas/jwt';

import {
  userRegisterSchema,
  userLoginSchema,
  userPostSchema,
  guestPostSchema,
} from '../schemas/user';

import type { UserType, GuestPostType } from '../schemas/user';

const authRoutes = async (server: FastifyInstance) => {
  server.post('/api/register', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = userRegisterSchema.safeParse(req.body);

    if (!parseResult.success) {
      console.log('Registration error', parseResult.error.cause);
      return reply.status(400).send({ message: parseResult.error.cause });
    }

    const password_hash = await hashPassword(parseResult.data.password);
    const newUser = userPostSchema.parse({ ...parseResult.data, password_hash });

    const user = await server.user.post(newUser);

    return await server.tfa.sendJwt(user, reply);
  });

  server.post('/api/login', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = userLoginSchema.safeParse(req.body);
    console.log('Login attempt', parseResult);

    if (!parseResult.success) {
      return reply.status(400).send({ message: parseResult.error.issues });
    }

    const user: UserType = await server.user.getByEmail(parseResult.data.email);
    console.log(user);

    if (!user) {
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    const valid = await verifyPassword(user.password_hash, parseResult.data.password);

    if (!valid) {
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    if (user.tfaEnabled) {
      return await server.tfa.handletfa(user, reply);
    }

    return await server.tfa.sendJwt(user, reply);
  });

  server.post('/api/refresh', async (req: FastifyRequest, reply: FastifyReply) => {
    console.log('Refresh token request', req.cookies);
    const parsedReq = refreshTokenSchema.safeParse(req.body);

    if (!parsedReq.success) {
      return reply.status(400).send({ message: 'Wrong Refresh Token.\nLogin Again!' });
    }

    const refreshToken = parsedReq.data.refreshToken;

    if (await isBlacklistedToken(refreshToken)) {
      return reply.status(401).send({ message: 'refresh token expired' });
    }

    try {
      const payload = await server.verifyRefreshToken(refreshToken);

      const newAccessToken = server.generateAccessToken(payload);
      const newRefreshToken = server.generateRefreshToken(payload);

      return reply.send({ jwt: newAccessToken, refreshToken: newRefreshToken });
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

    const user: UserType = await apiClientBackend(config);

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

    const user = await server.user.get(parseResult.data.userId);

    if (!user) {
      return reply.status(404).send({ message: 'User not found' });
    }

    if (parseResult.data.type === 'totp') {
      return await server.tfa.setupTotp(user, reply);
    }
  });

  server.post('/api/logout', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = refreshTokenSchema.safeParse(req.body);

    if (!parsedReq.success) {
      return reply.status(400).send({ message: parsedReq.error.issues });
    }

    const refreshToken = parsedReq.data.refreshToken;

    if (refreshToken) {
      const config: AxiosRequestConfig = {
        method: 'post',
        url: '/blacklist',
        data: { token: refreshToken },
      };
      await apiClientBackend(config);
    }

    return reply.send({ message: 'Logged out successfully' });
  });

  server.post('/api/guest/login', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = guestPostSchema.safeParse(req.body);

    if (!parsedReq.success) {
      return reply.status(400).send({ message: parsedReq.error.issues });
    }

    const newGuest: GuestPostType = parsedReq.data;

    const user = await server.user.post(newGuest);

    return await server.tfa.sendJwt(user, reply);
  });

  server.get('/api/auth/me', async (req: FastifyRequest, _) => {
    return { userId: req.user.id };
  });
};

export default fp(authRoutes);
