import fp from 'fastify-plugin';
import { FastifyInstance, FastifyReply } from 'fastify';

import fastifyCookie from '@fastify/cookie';

/* AuthData Object to store auth information in the reply 
interface AuthData {
  jwt: string;
  refreshToken: string;
  userId: string;
  role: string;
}
*/

/**
 * Cookie Management Plugin
 *
 * Provides helper methods for setting secure HTTP-only authentication cookies.
 * Sets both access and refresh tokens with appropriate security options.
 *
 * @requires jwt - Depends on JWT plugin for token generation
 * @decorates {function} setAuthCookies - Sets access and refresh token cookies for authenticated user
 */
const cookiePlugin = async (fastify: FastifyInstance) => {
  await fastify.register(fastifyCookie);

  /**
   * Sets authentication cookies for a user session
   * Creates both access token (15min, path: /) and refresh token (7d, path: /api)
   * Also populates reply.authData for immediate use in response
   *
   * @this {FastifyReply}
   * @param userId - Authenticated user's unique identifier
   * @returns FastifyReply for chaining
   */
  fastify.decorateReply('setAuthCookies', function (this: FastifyReply, data) {
    // Access token options: available to all routes
    const accessOptions = {
      httpOnly: true,
      secure: fastify.config.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 15 * 60,
    };

    const refreshOptions = {
      httpOnly: true,
      secure: fastify.config.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/api/refresh',
      maxAge: 7 * 24 * 60 * 60,
    };

    const accessToken = fastify.generateAccessToken({ id: data.id, role: data.role });
    const refreshToken = fastify.generateRefreshToken({ id: data.id, role: data.role });

    this.setCookie('refreshToken', refreshToken, refreshOptions);
    this.setCookie('accessToken', accessToken, accessOptions);

    this.authData = {
      jwt: accessToken,
      refreshToken: refreshToken,
      userId: data.id,
      role: data.role,
    };

    return this;
  });
  fastify.log.info('Cookie plugin loaded');
};

export default fp(cookiePlugin, {
  name: 'cookies',
  dependencies: ['jwt', 'config'],
  fastify: '5.x',
});
