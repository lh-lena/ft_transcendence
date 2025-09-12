import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { FastifyInstance } from 'fastify';
import { JwTPayloadSchema } from '../schemas/jwt';
import type { JwTPayloadType } from '../schemas/jwt';

export default fp(async (fastify: FastifyInstance) => {
  //set secrets in docker-compose.yml
  const accessSecret = process.env.ACCESS_TOKE_SECRET;
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

  if (!accessSecret || !refreshSecret) {
    throw new Error('JWT secrets are not defined in environment variables');
  }

  fastify.register(async (instance) => {
    instance.register(fastifyJwt, {
      secret: accessSecret,
      sign: { expiresIn: '15m' },
    });

    instance.decorate('generateAccessToken', (payload: { id: string }) => {
      return instance.jwt.sign(payload);
    });

    instance.decorate('verifyAccessToken', async (token: string): Promise<JwTPayloadType> => {
      try {
        const decoded = instance.jwt.verify(token);

        const result = JwTPayloadSchema.safeParse(decoded);
        if (!result.success) {
          throw new Error('Invalid token payload');
        }

        return result.data;
      } catch (err) {
        throw new Error('Invalid token');
      }
    });
  });

  fastify.register(
    async (refresh) => {
      refresh.register(fastifyJwt, {
        secret: refreshSecret,
        sign: { expiresIn: '7d' },
      });

      refresh.decorate('generateRefreshToken', (payload: { id: string }) => {
        return refresh.jwt.sign(payload);
      });

      refresh.decorate('verifyRefreshToken', async (token: string): Promise<JwTPayloadType> => {
        try {
          const decoded = refresh.jwt.verify<JwTPayloadType>(token);

          const result = JwTPayloadSchema.safeParse(decoded);
          if (!result.success) {
            throw new Error('Invalid token payload');
          }

          return result.data;
        } catch (err) {
          throw new Error('Invalid token');
        }
      });
    },
    { prefix: '/refresh' },
  );
});
