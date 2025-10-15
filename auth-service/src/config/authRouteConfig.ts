import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { hashPassword, verifyPassword } from '../utils/passwords';
import { AxiosRequestConfig } from 'axios';
import {
  userRegisterSchema,
  userLoginSchema,
  userPostSchema,
  guestPostSchema,
} from '../schemas/user';
import type { UserType, UserRegisterType, UserLoginType, GuestPostType } from '../schemas/user';

export const authRoutesConfig = {
  register: {
    method: 'post' as const,
    bodySchema: userRegisterSchema,
    customHandler: async (
      _req: FastifyRequest,
      reply: FastifyReply,
      server: FastifyInstance,
      parsedData: { body?: UserRegisterType },
    ) => {
      if (!parsedData.body) {
        return reply.status(400).send({ message: 'Invalid registration data' });
      }

      const password_hash = await hashPassword(parsedData.body.password);
      const newUser = userPostSchema.parse({ ...parsedData.body, password_hash });

      const user = await server.user.post(newUser);

      reply.doSending({
        code: 201,
        message: 'User successfully Registered',
        includeAuth: true,
        userId: user.userId,
      });
    },
    skipApiCall: true,
    errorMessages: {
      invalidBody: 'Invalid registration data',
    },
  },

  login: {
    method: 'post' as const,
    bodySchema: userLoginSchema,
    customHandler: async (
      _req: FastifyRequest,
      reply: FastifyReply,
      server: FastifyInstance,
      parsedData: { body?: UserLoginType },
    ) => {
      if (!parsedData.body) {
        return reply.status(400).send({ message: 'Invalid login data' });
      }
      const user: UserType = await server.user.getUser({ email: parsedData.body.email });

      if (!user || !user.password_hash) {
        return reply.status(401).send({ message: 'Invalid credentials' });
      }

      if (user.online) {
        return reply.status(403).send({ message: 'User already logged in' });
      }

      const valid = await verifyPassword(user.password_hash, parsedData.body.password);

      if (!valid) {
        return reply.status(401).send({ message: 'Invalid credentials' });
      }

      if (user.tfaEnabled) {
        const tfaData = await server.tfa.handletfa(user);
        return reply.code(200).send({ ...tfaData });
      }

      reply.doSending({
        code: 201,
        message: 'User successfully LogedIn',
        includeAuth: true,
        userId: user.userId,
      });
    },
    skipApiCall: true,
    errorMessages: {
      invalidBody: 'Invalid login data',
    },
  },

  logout: {
    method: 'post' as const,
    customHandler: async (req: FastifyRequest, reply: FastifyReply, server: FastifyInstance) => {
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
        .clearCookie('accessToken', { path: '/' })
        .clearCookie('refreshToken', { path: '/api' })
        .send({ message: 'successfull logout' });
    },
    skipApiCall: true,
  },

  guestLogin: {
    method: 'post' as const,
    bodySchema: guestPostSchema,
    customHandler: async (
      _req: FastifyRequest,
      reply: FastifyReply,
      server: FastifyInstance,
      parsedData: { body?: GuestPostType },
    ) => {
      if (!parsedData.body) {
        return reply.status(400).send({ message: 'Invalid guest data' });
      }

      const newGuest: GuestPostType = parsedData.body;
      const user = await server.user.post(newGuest);

      reply.doSending({
        code: 201,
        message: 'Guest successfully LogedIn',
        includeAuth: true,
        userId: user.userId,
      });
    },
    skipApiCall: true,
    errorMessages: {
      invalidBody: 'Invalid guest data',
    },
  },

  authMe: {
    method: 'get' as const,
    customHandler: async (req: FastifyRequest, reply: FastifyReply, server: FastifyInstance) => {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return reply.code(401).send({ error: 'Authorization header missing' });
      }

      const token = authHeader.replace('Bearer ', '');

      if (!token) {
        return reply.code(401).send({ error: 'Token missing' });
      }

      const jwtReturn = await server.verifyAccessToken(token);

      return reply.code(200).send({ userId: jwtReturn.id });
    },
    skipApiCall: true,
  },
};
