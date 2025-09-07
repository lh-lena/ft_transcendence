import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { FastifyInstance } from 'fastify';

export default fp(async (fastify: FastifyInstance) => {

  fastify.register(async (instance) => {
    instance.register(fastifyJwt, {
      secret: process.env.ACCESS_TOKEN_SECRET!,
      sign: { expiresIn: '15m' },
    });

    instance.decorate("authenticate", async (request: any, reply: any) => {
      try {
        await request.jwtVerify();
      } catch (err) {

        fastify.register(fastifyJwt, {
          secret: process.env.REFRESH_TOKEN_SECRET!,
          sign: { expiresIn: '7d' },
        }, { prefix: 'refresh' });
      });
