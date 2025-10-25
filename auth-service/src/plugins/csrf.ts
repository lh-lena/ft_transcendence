/**
 * CSRF Protection Plugin
 *
 * Provides Cross-Site Request Forgery (CSRF) protection for the auth microservice.
 * Uses token-based validation to prevent unauthorized requests from malicious sites.
 *
 * @module plugins/csrfProtection
 */

import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fastifyCsrf from '@fastify/csrf-protection';

/**
 * CSRF plugin configuration options
 */
interface CsrfPluginOptions {
  cookieOpts?: {
    signed?: boolean;
    httpOnly?: boolean;
    sameSite?: boolean | 'lax' | 'strict' | 'none';
    secure?: boolean;
    path?: string;
    maxAge?: number;
  };

  errorMessage?: string;

  exposeTokenEndpoint?: boolean;
}

const EXEMPT_ROUTES = ['/health', '/ready', '/metrics'];

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Checks if a route should be exempt from CSRF protection
 */
function isExemptRoute(path: string, exemptRoutes: string[]): boolean {
  return exemptRoutes.some((pattern) => {
    return path === pattern;
  });
}

const csrfPlugin: FastifyPluginAsync<CsrfPluginOptions> = async (
  server: FastifyInstance,
  options: CsrfPluginOptions,
) => {
  const isProduction = server.config.NODE_ENV === 'production';
  const isDevelopment = server.config.NODE_ENV === 'development';

  const exemptRoutes = EXEMPT_ROUTES;

  const cookieOpts = {
    signed: options.cookieOpts?.signed ?? true,
    httpOnly: options.cookieOpts?.httpOnly ?? true,
    sameSite: options.cookieOpts?.sameSite ?? (isProduction ? 'strict' : 'lax'),
    secure: options.cookieOpts?.secure ?? isProduction,
    path: options.cookieOpts?.path ?? '/',
    maxAge: options.cookieOpts?.maxAge ?? 3600,
    ...options.cookieOpts,
  };

  await server.register(fastifyCsrf, {
    sessionPlugin: '@fastify/cookie',
    cookieOpts,
  });

  server.log.info('CSRF protection laoded');

  /**
   * Hook to check CSRF token on unsafe methods
   * Runs before request handler
   */
  server.addHook('preHandler', async (request: FastifyRequest, _reply: FastifyReply) => {
    if (SAFE_METHODS.includes(request.method)) {
      server.log.debug(
        {
          url: request.url,
          method: request.method,
        },
        'Skipping CSRF check for safe Methods',
      );
      return;
    }

    if (isExemptRoute(request.url, exemptRoutes)) {
      server.log.debug(
        {
          url: request.url,
          method: request.method,
        },
        'Skipping CSRF check for exempt route',
      );
      return;
    }

    server.log.debug(
      {
        url: request.url,
        method: request.method,
        hasToken: !!(request.headers['csrf-token'] || request.headers['x-csrf-token']),
      },
      'CSRF protection check',
    );
  });

  server.decorateReply('refreshCsrfToken', async function (this: FastifyReply) {
    try {
      const token = this.generateCsrf();
      server.log.debug('CSRF token refreshed');
      return token;
    } catch (error) {
      server.log.error({ error }, 'Failed to refresh CSRF token');
      throw error;
    }
  });

  server.addHook('onRequest', async (request: FastifyRequest) => {
    const token =
      request.headers['csrf-token'] ||
      request.headers['x-csrf-token'] ||
      request.headers['x-xsrf-token'];

    if (token && isDevelopment) {
      server.log.debug(
        {
          requestId: request.id,
          hasToken: true,
          tokenLength: (token as string).length,
        },
        'CSRF token present in request',
      );
    }
  });
};

export default fp(csrfPlugin, {
  name: 'csrf-protection',
  fastify: '5.x',
  dependencies: ['config', '@fastify/cookie'],
});
