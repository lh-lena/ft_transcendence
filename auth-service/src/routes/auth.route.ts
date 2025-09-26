import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

import { hashPassword, verifyPassword } from '../auth/passwords';

import type { AxiosRequestConfig } from 'axios';

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

    const accessToken = server.generateAccessToken({ id: user.userId });
    const refreshToken = server.generateRefreshToken({ id: user.userId });

    reply
      .code(201)
      .setAuthCookie('jwt', accessToken)
      .setAuthCookie('refreshToken', refreshToken, { path: '/api' })
      .send({ message: 'successfull Registration', userId: user.userId });
  });

  server.post('/api/login', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = userLoginSchema.safeParse(req.body);
    console.log('Login attempt', parseResult);

    if (!parseResult.success) {
      return reply.status(400).send({ message: parseResult.error.issues });
    }

    const user: UserType = await server.user.getUser({ email: parseResult.data.email });

    if (!user || !user.password_hash) {
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    if (user.online) {
      return reply.status(403).send({ message: 'User already logged in' });
    }

    const valid = await verifyPassword(user.password_hash, parseResult.data.password);
    console.log(valid);

    if (!valid) {
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    if (user.tfaEnabled) {
      const tfaData = await server.tfa.handletfa(user);
      console.log({ ...tfaData });
      return reply.code(200).send({ ...tfaData });
    }

    const accessToken = server.generateAccessToken({ id: user.userId });
    const refreshToken = server.generateRefreshToken({ id: user.userId });

    reply
      .code(201)
      .setAuthCookie('jwt', accessToken)
      .setAuthCookie('refreshToken', refreshToken, { path: '/api' })
      .send({ message: 'successfull login', userId: user.userId });
  });

  server.post('/api/logout', async (req: FastifyRequest, reply: FastifyReply) => {
    console.log('COOKIES: \n', req.cookies);
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const config: AxiosRequestConfig = {
        method: 'post',
        url: '/blacklist',
        data: { token: refreshToken },
      };
      await server.api(config);
    }

    return reply
      .code(200)
      .clearCookie('jwt', { path: '/' })
      .clearCookie('refreshToken', { path: '/api' })
      .send({ message: 'successfull logout' });
  });

  server.post('/api/guest/login', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = guestPostSchema.safeParse(req.body);

    if (!parsedReq.success) {
      return reply.status(400).send({ message: parsedReq.error.issues });
    }

    const newGuest: GuestPostType = parsedReq.data;

    const user = await server.user.post(newGuest);

    const accessToken = server.generateAccessToken({ id: user.userId });
    const refreshToken = server.generateRefreshToken({ id: user.userId });

    reply
      .code(201)
      .setAuthCookie('jwt', accessToken)
      .setAuthCookie('refreshToken', refreshToken, { path: '/api' })
      .send({ message: 'successfull Guest login', userId: user.userId });
  });

  server.get('/api/auth/me', async (req: FastifyRequest, _) => {
    return { userId: req.user.id };
  });
};

export default fp(authRoutes);
