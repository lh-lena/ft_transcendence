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
  const allowedOrigins = [fastify.config.FRONTEND_URL, fastify.config.REALTIME_URL];

  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);

      fastify.log.warn(`CORS REJECTED: ${origin} - ${new Date().toISOString()}`);

      cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

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
