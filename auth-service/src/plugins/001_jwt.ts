import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default fp(async (fastify: FastifyInstance) => {
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
    },
    { prefix: '/refresh' },
  );
});
