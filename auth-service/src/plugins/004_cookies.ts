import fp from 'fastify-plugin';
import { FastifyInstance, FastifyReply } from 'fastify';

import fastifyCookie from '@fastify/cookie';

const cookiePlugin = async (fastify: FastifyInstance) => {
  await fastify.register(fastifyCookie);

  fastify.decorateReply('setAuthCookies', function (this: FastifyReply, userId: string) {
    const accessOptions = {
      httpOnly: true,
      secure: false, //TODO set to true in production
      sameSite: 'strict' as const,
      path: '/',
    };
    const accessToken = fastify.generateAccessToken({ id: userId });
    this.setCookie('jwt', accessToken, accessOptions);

    const refreshOptions = {
      httpOnly: true,
      secure: false, //TODO set to true in production
      sameSite: 'strict' as const,
      path: '/api',
    };
    const refreshToken = fastify.generateRefreshToken({ id: userId });
    this.setCookie('refreshJwt', refreshToken, refreshOptions);
    return this;
  });
};

export default fp(cookiePlugin);
