import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

import { hashPassword, verifyPassword } from '../auth/passwords';
//import { verifyJWT } from '../utils/jwt';

import { isBlacklisted } from '../services/userService';
import { apiClientBackend } from '../utils/apiClient';

import { tfaHandler } from '../utils/tfa';
import { tfaVerifySchema, tfaSetupSchema } from '../schemas/tfa';

import {
  userSchema,
  userRegisterSchema,
  userLoginSchema,
  userResponseSchema,
} from '../schemas/user';
import type { UserType } from '../schemas/user';

const authRoutes = async (server: FastifyInstance) => {
  const tfa = new tfaHandler(server);

  server.post('/api/register', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = userRegisterSchema.safeParse(req.body);

    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.issues });
    }

    const password_hash = await hashPassword(parseResult.data.password);
    const newUser: UserType = userSchema.parse({ ...parseResult.data, password_hash });

    const ret: UserType = await apiClientBackend.post('/user', newUser);

    const parsedRet = userResponseSchema.safeParse(ret);

    return reply.status(201).send({
      message: 'User registered successfully',
      data: parsedRet,
    });
  });

  server.post('/api/login', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = userLoginSchema.safeParse(req.body);

    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.issues });
    }

    const user: UserType = await apiClientBackend.get(`/user`, {
      params: { email: parseResult.data.email },
    });

    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const valid = await verifyPassword(user.password_hash, parseResult.data.password);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    if (user.tfaEnabled) {
      return await tfa.handletfa(user, reply);
    }

    return await tfa.sendJwt(user, reply);
  });

  server.post('/api/refresh', async (req: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return reply.status(401).send({ error: 'No refresh token' });
    }
    if (await isBlacklisted(refreshToken)) {
      return reply.status(401).send({ error: 'Token revoked. Login again' });
    }

    //TODO add proper typing to payload -> only use id
    try {
      const payload = server.verifyRefreshToken(refreshToken);
      const newAccessToken = server.generateAccessToken(payload);
      const newRefreshToken = server.generateRefreshToken(payload);
      reply.setCookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        path: '/api/refresh',
      });
      return reply.send({ accessToken: newAccessToken });
    } catch {
      return reply.status(401).send({ error: 'Invalid refresh token' });
    }
  });

  server.post('/api/verify', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = tfaVerifySchema.safeParse(req.body);

    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.issues });
    }

    if (!tfa.validSession(parseResult.data.sessionId)) {
      return reply.code(400).send({ error: 'Invalid or expired 2FA-Session' });
    }

    const user: UserType = await apiClientBackend.get(`/user`, {
      params: { id: parseResult.data.userId },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    if (parseResult.data.type === 'email') {
      return await tfa.checkMail(parseResult.data, user, reply);
    }

    if (parseResult.data.type === 'totp') {
      return await tfa.checkTotp(parseResult.data, user, reply);
    }

    if (parseResult.data.type === 'backup') {
      return await tfa.checkBackup(parseResult.data, user, reply);
    }

    return reply.send({ message: '2FA verified successfully' });
  });

  server.post('/api/tfaSetup', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = tfaSetupSchema.safeParse(req.body);

    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.issues });
    }

    const user: UserType = await apiClientBackend.get(`/user`, {
      params: { id: parseResult.data.userId },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    if (parseResult.data.type === 'totp') {
      return await tfa.setupTotp(user, reply);
    }

    if (parseResult.data.type === 'email') {
      return await tfa.setupEmail(user, reply);
    }
  });

  server.post('/api/logout', async (req: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await apiClientBackend.post('/blacklist', { token: refreshToken });
    }

    reply.clearCookie('refreshToken', { path: '/api/refresh' });

    return reply.send({ message: 'Logged out successfully' });
  });
};

export default fp(authRoutes);

// TODO: whats this for
// server.get('/api/auth/me', { preHandler: authMiddleware }, async (req, reply) => {
//   const user = (req as any).user;
//   return { user };
// });
