import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { FastifyInstance } from 'fastify';
import { JwTReturnSchema } from '../schemas/jwt';
import type { JwTReturnType } from '../schemas/jwt';

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(jwt, {
    secret: fastify.config.accessSecret,
    namespace: 'access',
    sign: { expiresIn: '1m' },
  });

  await fastify.register(jwt, {
    secret: fastify.config.refreshSecret,
    namespace: 'refresh',
    sign: { expiresIn: '7d' },
  });

  if (!fastify.jwt.access || !fastify.jwt.refresh) {
    throw new Error(
      'JWT namespaces not loaded! Register @fastify/jwt in your app before this plugin.',
    );
  }

  fastify.decorate('generateAccessToken', (payload: { id: string }) => {
    return fastify.jwt.access.sign(payload);
  });

  fastify.decorate('verifyAccessToken', async (token: string): Promise<JwTReturnType> => {
    const decoded = fastify.jwt.access.verify(token);

    const result = JwTReturnSchema.safeParse(decoded);

    if (!result.success) {
      throw new Error('Invalid token payload');
    }

    return result.data;
  });

  fastify.decorate('generateRefreshToken', (payload: { id: string }) => {
    return fastify.jwt.refresh.sign(payload);
  });

  fastify.decorate('verifyRefreshToken', async (token: string): Promise<JwTReturnType> => {
    const decoded = fastify.jwt.refresh.verify(token);

    const result = JwTReturnSchema.safeParse(decoded);

    if (!result.success) {
      throw new Error('Invalid token payload');
    }

    return result.data;
  });
});
