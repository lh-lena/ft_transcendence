import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

import { hashPassword, verifyPassword } from '../auth/passwords';

import { isBlacklistedToken } from '../utils/blacklistToken';
import { apiClientBackend } from '../utils/apiClient';
import type { AxiosRequestConfig } from 'axios';

import { tfaHandler } from '../utils/tfa';
import { tfaVerifySchema, tfaSetupSchema } from '../schemas/tfa';
import { refreshTokenSchema } from '../schemas/jwt';

import {
  userSchema,
  userRegisterSchema,
  userLoginSchema,
  userPostSchema,
  guestSchema,
} from '../schemas/user';

import type { UserType, GuestType } from '../schemas/user';

const authRoutes = async (server: FastifyInstance) => {
  const tfa = new tfaHandler(server);

  server.post('/api/register', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = userRegisterSchema.safeParse(req.body);
    console.log('Registering User', parseResult);

    if (!parseResult.success) {
      console.log('Registration error', parseResult.error.message);
      return reply.status(400).send({ error: parseResult.error.issues });
    }

    const password_hash = await hashPassword(parseResult.data.password);
    const newUser = userPostSchema.parse({ ...parseResult.data, password_hash });

    console.log('New User to register', newUser);

    const config: AxiosRequestConfig = {
      method: 'post',
      url: '/user',
      //headers: req.headers,
      data: newUser,
    };
    const ret = await apiClientBackend(config);
    console.log('Registered User', ret);

    const createdUser = userSchema.safeParse(ret);

    if (!createdUser.success) {
      console.log('Created user parsing error', createdUser.error);
      return reply.status(500).send({ error: 'User creation failed' });
    }

    return await tfa.sendJwt(createdUser.data, reply);
  });

  server.post('/api/login', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = userLoginSchema.safeParse(req.body);
    console.log('Login attempt', parseResult);

    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.issues });
    }

    const config: AxiosRequestConfig = {
      method: 'get',
      url: '/user',
      headers: req.headers,
      params: { email: parseResult.data.email },
    };

    const userArr: UserType[] = await apiClientBackend(config);

    if (userArr.length !== 1) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const user = userArr[0];

    const valid = await verifyPassword(user.password_hash, parseResult.data.password);
    console.log('Password valid', valid);

    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    if (user.tfaEnabled) {
      return await tfa.handletfa(user, reply);
    }

    return await tfa.sendJwt(user, reply);
  });

  server.post('/api/refresh', async (req: FastifyRequest, reply: FastifyReply) => {
    console.log('Refresh token request', req.cookies);
    const parsedReq = refreshTokenSchema.safeParse(req.body);

    if (!parsedReq.success) {
      return reply.status(400).send({ error: 'Wrong Refresh Token.\nLogin Again!' });
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
      return reply.status(400).send({ error: parseResult.error.issues });
    }

    if (!tfa.validSession(parseResult.data.sessionId)) {
      return reply.code(400).send({ error: 'Invalid or expired 2FA-Session' });
    }

    const config: AxiosRequestConfig = {
      method: 'get',
      url: `/user/${parseResult.data.userId}`,
    };

    const user: UserType = await apiClientBackend(config);

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
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
    const method = 'get';
    const url = `/user/${parseResult.data.userId}`;

    const config: AxiosRequestConfig = {
      method,
      url,
      headers: req.headers,
      params: { id: parseResult.data.userId },
    };

    const user: UserType = await apiClientBackend(config);

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    if (parseResult.data.type === 'totp') {
      return await tfa.setupTotp(user, reply);
    }
  });

  server.post('/api/logout', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = refreshTokenSchema.safeParse(req.body);

    if (!parsedReq.success) {
      return reply.status(400).send({ error: parsedReq.error.issues });
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

  //TODO add guest login
  server.post('/api/guest/login', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = guestSchema.safeParse(req.body);

    if (!parsedReq.success) {
      return reply.status(400).send({ error: parsedReq.error.issues });
    }

    const newGuest: GuestType = parsedReq.data;

    newGuest.username = newGuest.alias;

    const config: AxiosRequestConfig = {
      method: 'post',
      url: '/user',
      data: newGuest,
    };

    console.log('Creating guest user', config);

    const ret: UserType = await apiClientBackend(config);

    return await tfa.sendJwt(ret, reply);
  });

  server.get('/api/auth/me', async (req: FastifyRequest, _) => {
    const user = userSchema.parse(req.user);
    console.log(user);
    return user;
  });
};

export default fp(authRoutes);

// TODO: whats this for
// server.get('/api/auth/me', { preHandler: authMiddleware }, async (req, reply) => {
//   const user = (req as any).user;
//   return { user };
// });
