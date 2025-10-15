import fp from 'fastify-plugin';
import { FastifyInstance, FastifyReply } from 'fastify';

import fastifyCookie from '@fastify/cookie';

/* AuthData Object to store auth information in the reply 
interface AuthData {
  jwt: string;
  userId: string;
  refreshToken: string;
}
*/

const cookiePlugin = async (fastify: FastifyInstance) => {
  await fastify.register(fastifyCookie);

  fastify.decorateReply('setAuthCookies', function (this: FastifyReply, userId: string) {
    const accessOptions = {
      httpOnly: true,
      secure: false, //TODO set to true in production
      sameSite: 'strict' as const,
      path: '/',
    };

    const refreshOptions = {
      httpOnly: true,
      secure: false, //TODO set to true in production
      sameSite: 'strict' as const,
      path: '/api',
    };

    const accessToken = fastify.generateAccessToken({ id: userId });
    const refreshToken = fastify.generateRefreshToken({ id: userId });

    this.setCookie('refreshToken', refreshToken, refreshOptions);
    this.setCookie('accessToken', accessToken, accessOptions);

    this.authData = {
      jwt: accessToken,
      refreshToken: refreshToken,
      userId: userId,
    };

    return this;
  });
};

export default fp(cookiePlugin);
