import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

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

    instance.decorate(
      'authenticateAccess',
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          await request.jwtVerify();
        } catch (err) {
          reply.code(401).send({ message: 'Unauthorized' });
        }
      },
    );

    instance.decorate('generateAccessToken', (payload: object) => {
      return instance.jwt.sign(payload);
    });

    instance.decorate('verifyAccessToken', async (token: string) => {
      try {
        return instance.jwt.verify(token);
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

      refresh.decorate('generateRefreshToken', (payload: object) => {
        return refresh.jwt.sign(payload);
      });

      refresh.decorate('verifyRefreshToken', async (token: string) => {
        try {
          return refresh.jwt.verify(token);
        } catch (err) {
          throw new Error('Invalid token');
        }
      });
    },
    { prefix: '/refresh' },
  );
});
