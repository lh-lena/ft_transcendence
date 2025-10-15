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
   * ⚠️ SECURITY CONSIDERATIONS:
   * - httpOnly prevents JavaScript access (XSS protection)
   * - secure ensures HTTPS-only transmission (in production)
   * - sameSite: 'lax' balances security with OAuth compatibility
   * - Different paths limit refresh token exposure
   * - maxAge aligns with JWT expiration times
   */

  /**
   * Sets authentication cookies for a user session
   * Creates both access token (15min, path: /) and refresh token (7d, path: /api)
   * Also populates reply.authData for immediate use in response
   *
   * @this {FastifyReply}
   * @param userId - Authenticated user's unique identifier
   * @returns FastifyReply for chaining
   */
  fastify.decorateReply('setAuthCookies', function (this: FastifyReply, userId: string) {
    // Access token options: available to all routes
    const accessOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 15 * 60,
    };

    // Refresh token options: restricted to auth endpoints only
    const refreshOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60,
    };

    // Generate tokens using JWT plugin methods
    const accessToken = fastify.generateAccessToken({ id: userId });
    const refreshToken = fastify.generateRefreshToken({ id: userId });

    /*
     * Set cookies in the response
     * - refreshToken: long-lived, httpOnly, secure, path=/api/auth
     * - accessToken: short-lived, httpOnly, secure, path=/
     */
    this.setCookie('refreshToken', refreshToken, refreshOptions);
    this.setCookie('accessToken', accessToken, accessOptions);

    //set authData for immediate use in response
    this.authData = {
      jwt: accessToken,
      refreshToken: refreshToken,
      userId: userId,
    };

    return this;
  });
  fastify.log.info('Cookie plugin loaded');
};

export default fp(cookiePlugin, {
  name: 'cookies',
  dependencies: ['jwt'],
  fastify: '5.x',
});
