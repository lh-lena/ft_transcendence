import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { JwTPayloadSchema } from '../schemas/jwt';
import type { JwTPayloadType } from '../schemas/jwt';

export default fp(async (fastify: FastifyInstance) => {
  if (!fastify.jwt.access || !fastify.jwt.refresh) {
    throw new Error(
      'JWT namespaces not loaded! Register @fastify/jwt in your app before this plugin.',
    );
  }

  fastify.decorate('generateAccessToken', (payload: { id: string }) => {
    return fastify.jwt.access.sign(payload);
  });

  fastify.decorate('verifyAccessToken', async (token: string): Promise<JwTPayloadType> => {
    try {
      const decoded = fastify.jwt.access.verify(token);

      const result = JwTPayloadSchema.safeParse(decoded);
      if (!result.success) {
        throw new Error('Invalid token payload');
      }

      return result.data;
    } catch (err) {
      throw new Error('Invalid token');
    }
  });

  fastify.decorate('generateRefreshToken', (payload: { id: string }) => {
    return fastify.jwt.refresh.sign(payload);
  });

  fastify.decorate('verifyRefreshToken', async (token: string): Promise<JwTPayloadType> => {
    try {
      const decoded = fastify.jwt.refresh.verify(token);

      const result = JwTPayloadSchema.safeParse(decoded);
      if (!result.success) {
        throw new Error('Invalid token payload');
      }

      return result.data;
    } catch (err) {
      throw new Error('Invalid token');
    }
  });
  console.log('registered jwt plugin');
});
