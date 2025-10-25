/**
 * Input Sanitization PreHandler Hook
 *
 * Sanitizes all incoming request data to prevent XSS attacks.
 * Runs before authentication to clean input early in the request lifecycle.
 *
 * @module hooks/inputSanitization
 */

import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import DOMPurify from 'isomorphic-dompurify';

const SKIP_SANITIZATION_ROUTES = ['/api/health', '/api/metrics', '/api/upload'];

const SKIP_FIELDS = ['password', 'accessToken', 'refreshToken'];

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

function shouldSkipRoute(path: string, skipRoutes: string[]): boolean {
  return skipRoutes.some((pattern) => {
    return path === pattern;
  });
}

/**
 * Sanitize a single value
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    const config = {
      ALLOWED_TAGS: [] as string[],
      ALLOWED_ATTR: [] as string[],
      KEEP_CONTENT: true,
    };

    return DOMPurify.sanitize(value, config);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === 'object' && value !== null) {
    return sanitizeObject(value as Record<string, unknown>);
  }

  return value;
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (SKIP_FIELDS.includes(key)) {
      sanitized[key] = value;
      continue;
    }

    sanitized[key] = sanitizeValue(value);
  }

  return sanitized;
}

function wasModified(original: unknown, sanitized: unknown): boolean {
  try {
    return JSON.stringify(original) !== JSON.stringify(sanitized);
  } catch {
    return false;
  }
}

const inputSanitizationPlugin = async (server: FastifyInstance): Promise<void> => {
  const isDevelopment = server.config.NODE_ENV === 'development';
  const strictMode = server.config.NODE_ENV === 'production';

  server.addHook('preHandler', async (req: FastifyRequest, reply: FastifyReply) => {
    const routePath = req.routeOptions.url || req.url;

    if (shouldSkipRoute(routePath, SKIP_SANITIZATION_ROUTES)) {
      server.log.debug({ route: routePath }, 'Skipping sanitization for route');
      return;
    }

    if (SAFE_METHODS.includes(req.method)) {
      server.log.debug({ method: req.method }, 'Skipping sanitization for safe method');
      return;
    }

    const startTime = Date.now();
    let modified = false;

    try {
      if (req.body && typeof req.body === 'object') {
        const originalBody = req.body;
        const sanitizedBody = sanitizeObject(req.body as Record<string, unknown>);

        if (wasModified(originalBody, sanitizedBody)) {
          modified = true;

          server.log.warn(
            {
              route: routePath,
              method: req.method,
              ip: req.ip,
              requestId: req.id,
              strictMode,
            },
            'XSS attempt detected in request body',
          );

          if (strictMode) {
            return reply.code(400).send({
              success: false,
              error: 'Bad Request',
              message: 'Invalid input detected. Request rejected for security reasons.',
              requestId: req.id,
            });
          }

          req.body = sanitizedBody;
        }
      }

      if (req.query && typeof req.query === 'object') {
        const originalQuery = req.query;
        const sanitizedQuery = sanitizeObject(req.query as Record<string, unknown>);

        if (wasModified(originalQuery, sanitizedQuery)) {
          modified = true;

          server.log.warn(
            {
              route: routePath,
              method: req.method,
              ip: req.ip,
              requestId: req.id,
              strictMode,
            },
            'XSS attempt detected in query parameters',
          );

          if (strictMode) {
            return reply.code(400).send({
              success: false,
              error: 'Bad Request',
              message: 'Invalid query parameters detected.',
              requestId: req.id,
            });
          }

          req.query = sanitizedQuery;
        }
      }

      if (req.params && typeof req.params === 'object') {
        const originalParams = req.params;
        const sanitizedParams = sanitizeObject(req.params as Record<string, unknown>);

        if (wasModified(originalParams, sanitizedParams)) {
          modified = true;

          server.log.warn(
            {
              route: routePath,
              method: req.method,
              ip: req.ip,
              requestId: req.id,
              strictMode,
            },
            'XSS attempt detected in URL parameters',
          );

          if (strictMode) {
            return reply.code(400).send({
              success: false,
              error: 'Bad Request',
              message: 'Invalid URL parameters detected.',
              requestId: req.id,
            });
          }

          req.params = sanitizedParams;
        }
      }

      const duration = Date.now() - startTime;

      if (isDevelopment && duration > 50) {
        server.log.warn(
          {
            route: routePath,
            duration: `${duration}ms`,
          },
          'Slow sanitization detected',
        );
      }

      if (modified) {
        server.log.info(
          {
            route: routePath,
            method: req.method,
            ip: req.ip,
            duration: `${duration}ms`,
          },
          'Input sanitized successfully',
        );
      }
    } catch (error) {
      server.log.error(
        {
          error,
          route: routePath,
          method: req.method,
          ip: req.ip,
        },
        'Failed to sanitize input',
      );

      if (strictMode) {
        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Unable to process request. Please try again later.',
          requestId: req.id,
        });
      }
    }
  });

  server.log.info('Registered input sanitization preHandler hook');
};

export default fp(inputSanitizationPlugin, {
  name: 'sanitaize',
  dependencies: ['config'],
});
