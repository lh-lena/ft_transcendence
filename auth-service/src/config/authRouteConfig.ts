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

/**
 * Authentication route configurations
 * Handles user registration, login, logout, and guest access
 */
export const authRoutesConfig = {
  /**
   * User Registration
   * Creates a new user account with hashed password
   * @returns 201 - User created with auth tokens
   */
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
        message: 'User successfully registered',
        includeAuth: true,
        userId: user.userId,
        role: 'user',
      });
    },
    skipApiCall: true,
    errorMessages: {
      invalidBody: 'Invalid registration data',
    },
  },

  /**
   * User Login
   * Authenticates user credentials and handles 2FA if enabled
   * @returns 200 - 2FA challenge if enabled
   * @returns 201 - Login successful with auth tokens
   * @returns 401 - Invalid credentials
   * @returns 403 - User already logged in
   */
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
      const user: UserType = await server.user.getUser({ username: parsedData.body.username });
      const password_hash =
        user?.password_hash ||
        '$argon2id$v=19$m=65536,t=2,p=1$aGVsbG93b3JsZHNhbHQxMjM$7t+JdPKbdXcK9x9PSvvOT2fBKJdUFhGP8s5f1CLnLxM';

      const valid = await verifyPassword(password_hash, parsedData.body.password);

      if (!user || !user.password_hash || !valid) {
        return reply.status(401).send({ message: 'Invalid credentials' });
      }

      if (user.online) {
        return reply.status(403).send({ message: 'User already logged in' });
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
        role: 'user',
      });
    },
    skipApiCall: true,
    errorMessages: {
      invalidBody: 'Invalid login data',
    },
  },

  /**
   * User Logout
   * Invalidates tokens and updates user online status
   * @requires Authentication
   * @returns 200 - Logout successful
   */
  logout: {
    method: 'post' as const,
    customHandler: async (req: FastifyRequest, reply: FastifyReply, server: FastifyInstance) => {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        try {
          const config: AxiosRequestConfig = {
            method: 'post',
            url: '/blacklist',
            data: { token: refreshToken },
          };
          await server.api(config);
        } catch (error) {
          server.log.warn(
            { error, token: refreshToken },
            'Failed to blacklist token during logout',
          );
        }
      }
      try {
        const config: AxiosRequestConfig = {
          method: 'patch',
          url: `/user/${req.user.id}`,
          data: { online: false },
        };
        await server.api(config);
      } catch (error) {
        server.log.warn(
          { error, userId: req.user.id },
          'Failed to update online status during logout',
        );
      }

      return reply
        .code(200)
        .clearCookie('accessToken', { path: '/' })
        .clearCookie('refreshToken', { path: '/api/refresh' })
        .send({ message: 'Successfully logged out' });
    },
    skipApiCall: true,
  },

  /**
   * Guest Login
   * Creates temporary guest account for anonymous users
   * @returns 201 - Guest created with limited auth tokens
   */
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
        role: 'guest',
      });
    },
    skipApiCall: true,
    errorMessages: {
      invalidBody: 'Invalid guest data',
    },
  },

  /**
   * Verify Authentication
   * Validates access token and returns user ID
   * @requires Authorization header with Bearer token
   * @returns 200 - Token valid with user ID
   * @returns 401 - Invalid or missing token
   */
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

      try {
        server.log.debug({ token }, 'Verifying access token in authMe route');
        const jwtReturn = await server.verifyAccessToken(token);

        return reply.code(200).send({ userId: jwtReturn.id });
      } catch {
        return reply.code(401).send({ error: 'Token expired' });
      }
    },
    skipApiCall: true,
  },
};
