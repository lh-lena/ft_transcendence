import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import cors from '@fastify/cors';

const corsPlugin = async (fastify: FastifyInstance) => {
  const allowedOrigins = [fastify.config.frontendUrl, fastify.config.realtimeUrl];

  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);

      console.log(`❌ CORS REJECTED: ${origin} - ${new Date().toISOString()}`);

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

  // Startup logging
  console.log('\n🌐 CORS Plugin Initialized');
  console.log('────────────────────────────');
  allowedOrigins.forEach((origin, index) => {
    if (origin) {
      console.log(`${index + 1}. ${origin}`);
    } else {
      console.log(`${index + 1}. ⚠️  ORIGIN NOT SET`);
    }
  });
  console.log('────────────────────────────\n');
};

export default fp(corsPlugin);
