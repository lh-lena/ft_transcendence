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
      .send({ message: 'successfull Registration', jwt: accessToken, userId: user.userId });
  });

  server.post('/api/login', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = userLoginSchema.safeParse(req.body);

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

    if (!valid) {
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    if (user.tfaEnabled) {
      const tfaData = await server.tfa.handletfa(user);
      return reply.code(200).send({ ...tfaData });
    }

    const accessToken = server.generateAccessToken({ id: user.userId });
    const refreshToken = server.generateRefreshToken({ id: user.userId });

    reply
      .code(201)
      .setAuthCookie('jwt', accessToken)
      .setAuthCookie('refreshToken', refreshToken, { path: '/api' })
      .send({ message: 'successfull login', jwt: accessToken, userId: user.userId });
  });

  server.post('/api/logout', async (req: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const config: AxiosRequestConfig = {
        method: 'post',
        url: '/blacklist',
        data: { token: refreshToken },
      };
      await server.api(config);
    }

    const config: AxiosRequestConfig = {
      method: 'patch',
      url: `/user/${req.user.id}`,
      data: { online: false },
    };
    await server.api(config);

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

    console.log('New Guest: ', parsedReq.data, 'Post to: ', server.user.post);

    const newGuest: GuestPostType = parsedReq.data;

    const user = await server.user.post(newGuest);

    console.log('new registered User: ', user);

    const accessToken = server.generateAccessToken({ id: user.userId });
    const refreshToken = server.generateRefreshToken({ id: user.userId });

    reply
      .code(201)
      .setAuthCookie('jwt', accessToken)
      .setAuthCookie('refreshToken', refreshToken, { path: '/api' })
      .send({ message: 'successfull Guest login', jwt: accessToken, userId: user.userId });
  });

  server.get('/api/auth/me', async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    //console.log(authHeader);

    if (!authHeader) {
      return reply.code(401).send({ error: 'Authorization header missing' });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return reply.code(401).send({ error: 'Token missing' });
    }

    const jwtReturn = await server.verifyAccessToken(token);

    return reply.code(200).send({ userId: jwtReturn.id });
  });
};

export default fp(authRoutes);
