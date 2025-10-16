import fp from 'fastify-plugin';
import { FastifyInstance, FastifyReply } from 'fastify';

//general reply plugin for sending responses

interface SendOptions {
  code?: number;
  data?: object;
  message?: string;
  includeAuth?: boolean;
  userId?: string;
}

interface ResponseData {
  message?: string;
  timestamp: string;
  jwt?: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Custom Reply Helpers Plugin
 *
 * Extends FastifyReply with standardized response formatting including
 * timestamps, optional auth tokens, and consistent structure.
 *
 * @requires cookies - Depends on cookie plugin for setAuthCookies
 * @requires jwt - Depends on JWT plugin for token generation
 * @decorates {function} doSending - Standardized response sender with optional auth
 */
const replyPlugin = async (fastify: FastifyInstance) => {
  /**
   * Sends a standardized JSON response with optional authentication
   *
   * @this {FastifyReply}
   * @param options - Response configuration
   * @param options.code - HTTP status code (default: 200)
   * @param options.data - Response data object to merge
   * @param options.message - Optional message string
   * @param options.includeAuth - Whether to include JWT tokens (requires userId)
   * @param options.userId - User ID for auth token generation
   * @returns FastifyReply for chaining
   *
   * @example
   * reply.doSending({
   *   code: 201,
   *   data: { user },
   *   message: 'User created',
   *   includeAuth: true,
   *   userId: user.id
   * });
   */
  function doSending(this: FastifyReply, options: SendOptions = {}): FastifyReply {
    const { code = 200, data = {}, message, includeAuth = false, userId } = options;

    // Validate HTTP status code
    if (code < 100 || code > 599) {
      fastify.log.error(`Invalid HTTP status code: ${code}`);
      this.code(500);
    } else {
      this.code(code);
    }

    // Build response object with timestamp
    const response: ResponseData = { ...data, timestamp: new Date().toISOString() };

    // Add optional message
    if (message) {
      response.message = message;
    }

    // Include authentication tokens if requested
    if (includeAuth && userId) {
      this.setAuthCookies(userId);
      if (this.authData) {
        const authData = this.authData;
        response.jwt = authData.jwt;
        response.userId = authData.userId;
      }
    } else if (includeAuth && !userId) {
      // Warn if auth was requested but userId missing
      fastify.log.warn('includeAuth requested but userId not provided');
    }

    return this.send(response);
  }

  fastify.decorateReply('doSending', doSending);

  fastify.log.info('Reply helpers plugin loaded');
};

export default fp(replyPlugin, {
  name: 'reply-plugin',
  dependencies: ['cookies', 'jwt'],
  fastify: '5.x',
});
