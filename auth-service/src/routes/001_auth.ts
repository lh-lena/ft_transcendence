import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { verifyPassword } from '../utils/password';
import { isBlacklisted, apiClientBackend } from '../services/userService';

import { userSchema, userRegisterSchema, userLoginSchema } from '../schemas/user';
import type { UserResponseType, UserType } from '../schemas/user';

import { tfaVerifySchema, tfaSetupSchema } from '../schemas/tfa';

const authRoutes = async (server: FastifyInstance) => {
  server.post(
    '/api/register',
    async (req: FastifyRequest, reply: FastifyReply): Promise<UserResponseType> => {
      const parsedResult = userRegisterSchema.safeParse(req.body);
      if (!parsedResult.success) {
        return reply.status(400).send({ error: parsedResult.error.issues });
      }

      const ret = await auth.register(parsedResult.data);

      const parsedRet = userSchema.safeParse(ret);
      if (!parsedRet.success) {
        return reply.status(400).send({ error: parsedRet.error.issues });
      }

      return reply.status(201).send({
        message: 'User registered successfully',
        data: parsedRet.data,
      });
    },
  );

  server.post(
    '/api/login',
    async (req: FastifyRequest, reply: FastifyReply): Promise<UserResponseType> => {
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
    },
  );

  server.post('/api/refresh', async (req: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return reply.status(401).send({ error: 'No refresh token' });
    }
    if (await isBlacklisted(refreshToken)) {
      return reply.status(401).send({ error: 'Token revoked. Login again' });
    }

    try {
      const payload = server.refresh.verify(refreshToken);
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

  //TODO:: add middleware hook
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

export async function cleanupExpiredSession() {
  tfa.cleanupExpiredSessions();
}

export default fp(authRoutes);

// TODO: whats this for
// server.get('/api/auth/me', { preHandler: authMiddleware }, async (req, reply) => {
//   const user = (req as any).user;
//   return { user };
// });
