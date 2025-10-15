import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import cors from '@fastify/cors';

/**
 * CORS Configuration Plugin
 *
 * Configures Cross-Origin Resource Sharing to allow requests from
 * frontend and realtime services. Includes debug endpoint in non-production.
 *
 * @requires config - Depends on config plugin for allowed origins
 * @throws {Error} If origin is not in allowedOrigins list
 */
const corsPlugin = async (fastify: FastifyInstance) => {
  // Define allowed origins from service URLs
  const allowedOrigins = [fastify.config.frontendUrl, fastify.config.realtimeUrl];

  /**
   * Validates incoming request origin against allowed list
   * @param origin - Request origin header value
   * @param cb - Callback to approve/reject the request
   */
  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g., mobile apps, Postman)
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);

      // Log rejected CORS attempts for security monitoring
      fastify.log.warn(`CORS REJECTED: ${origin} - ${new Date().toISOString()}`);

      cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Development-only endpoint to check CORS config
  if (process.env.NODE_ENV !== 'production') {
    fastify.get('/api/debug/cors', async (request, _) => {
      return {
        corsConfiguration: {
          allowedOrigins: allowedOrigins.filter(Boolean),
          credentials: true,
          methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization'],
          environment: process.env.NODE_ENV || 'development',
        },
        currentRequest: {
          origin: request.headers.origin,
          userAgent: request.headers['user-agent'],
          method: request.method,
          isAllowed: !request.headers.origin || allowedOrigins.includes(request.headers.origin),
        },
        configValues: {
          frontendUrl: fastify.config.frontendUrl,
          realtimeUrl: fastify.config.realtimeUrl,
        },
      };
    });

    fastify.log.info('CORS debug endpoint available at /api/debug/cors');
  }
  fastify.log.info('CORS configuration loaded');
};

export default fp(corsPlugin, {
  name: 'cors',
  dependencies: ['config'],
  fastify: '5.x',
});
