/**
 * Auth Service - Main Server Entry Point
 *
 * Initializes and starts the Fastify server with:
 * - Production-grade logging (pino with pretty-print in dev)
 * - Auto-loaded plugins, routes, and hooks
 * - Prometheus metrics for monitoring
 * - CSRF protection
 * - Graceful shutdown handling
 * - Reverse proxy for file uploads
 *
 * @module server
 */

import Fastify from 'fastify';
import fastifyCsrf from '@fastify/csrf-protection';
import fastifyHttpProxy from '@fastify/http-proxy';
import AutoLoad from '@fastify/autoload';
import path from 'path';
import { LoggerOptions } from 'pino';
import { fileURLToPath } from 'url';

// ESM dirname compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configure logger based on environment
 * Production: JSON logs for structured logging aggregators
 * Development: Pretty-printed logs with pino-pretty
 */
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

const loggerConfig: LoggerOptions = isProduction
  ? {
      level: 'info',
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
        remove: true,
      },
      serializers: {
        req: (req) => ({
          method: req.method,
          url: req.url,
          remoteAddress: req.ip,
        }),
        res: (res) => ({
          statusCode: res.statusCode,
        }),
      },
    }
  : {
      level: isDevelopment ? 'debug' : 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      },
    };

/**
 * Initialize Fastify server instance
 */
export const server = Fastify({
  logger: loggerConfig,
  requestIdLogLabel: 'requestId',
  disableRequestLogging: false,
  //needed for req.ip for logging
  requestIdHeader: 'x-request-id',
  trustProxy: isProduction,
  bodyLimit: 1048576,
  connectionTimeout: 10000,
  keepAliveTimeout: 5000,
});

/**
 * Global error handler
 * Standardizes error responses and ensures proper logging
 *
 * @param error - Error object thrown in route handlers
 * @param request - Fastify request object
 * @param reply - Fastify reply object
 */
server.setErrorHandler((error, request, reply) => {
  server.log.error(
    {
      err: error,
      requestId: request.id,
      url: request.url,
      method: request.method,
    },
    'Request error occurred',
  );

  let statusCode = 500;

  if ('statusCode' in error && typeof error.statusCode === 'number') statusCode = error.statusCode;
  else if ('status' in error && typeof error.status === 'number') statusCode = error.status;

  const errorMessage = error.message || 'Internal Server Error';

  const responseMessage =
    isProduction && statusCode === 500 ? 'Internal Server Error' : errorMessage;

  const data = 'data' in error ? error.data : null;

  reply.status(statusCode).send({
    success: false,
    message: responseMessage,
    data,
    requestId: request.id,
  });
});

/**
 * Loads plugins, routes, and hooks in correct order
 */
const start = async () => {
  try {
    server.log.info('Starting auth service...');

    // ------------ Core Security Plugins ------------

    /**
     * CSRF Protection
     * Requires session plugin for token storage
     */
    await server.register(fastifyCsrf, {
      sessionPlugin: '@fastify/cookie',
    });
    server.log.info('CSRF protection enabled');

    // ------------ Auto-load Configuration Plugins ------------

    /**
     * Load configuration and setup plugins first
     * These must load before routes/hooks that depend on them
     * Files are loaded in alphabetical order (000_, 001_, etc.)
     */
    await server.register(AutoLoad, {
      dir: path.join(__dirname, 'plugins'),
      options: {
        prefix: '',
      },
    });
    server.log.info('Plugins loaded successfully');

    // ------------ Auto-load Routes ------------

    /**
     * Load API routes
     * Routes have access to all loaded plugins
     */
    await server.register(AutoLoad, {
      dir: path.join(__dirname, 'routes'),
      options: {
        prefix: '/api',
      },
    });
    server.log.info('Routes loaded successfully');

    // ------------ Auto-load Hooks ------------

    /**
     * Load lifecycle hooks (onRequest, preHandler, etc.)
     * These apply to all routes
     */
    await server.register(AutoLoad, {
      dir: path.join(__dirname, 'hooks'),
    });
    server.log.info('Hooks loaded successfully');

    // ------------ HTTP Proxy for File Uploads ------------

    /**
     * Proxy file upload requests to backend service
     * Avoids handling multipart/form-data in auth service
     */
    const backendHost = server.config.backendUrl.replace(/^https?:\/\//, '');

    await server.register(fastifyHttpProxy, {
      upstream: server.config.backendUrl,
      prefix: '/api/upload',
      rewritePrefix: '/api/upload',
      http2: false,
    });
    server.log.info(`proxy for upload configured: ${backendHost}:8080`);

    // ------------ Health Check Endpoint ------------

    /**
     * Liveness probe for container orchestration (Kubernetes, Docker Compose)
     * Returns 200 if server is running
     */
    server.get('/health', async () => ({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }));

    /**
     * Readiness probe - checks if service is ready to accept traffic
     * Validates database connections, external services, etc.
     */
    server.get('/ready', async () => {
      const checks = {
        server: true,
        config: !!server.config,
      };

      const isReady = Object.values(checks).every(Boolean);

      if (!isReady) {
        throw { statusCode: 503, message: 'Service not ready', data: checks };
      }

      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks,
      };
    });

    // ------------ Start Listening ------------

    /**
     * Start HTTP server
     * Uses host and port from config plugin (loaded from env vars)
     */
    await server.listen({
      port: server.config.port,
      host: server.config.host,
    });

    server.updateServiceHealth(true);

    server.log.info(
      {
        port: server.config.port,
        host: server.config.host,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
      },
      'Auth service started successfully',
    );
  } catch (err) {
    server.log.fatal(err, 'Failed to start auth service');

    if (server.updateServiceHealth) {
      server.updateServiceHealth(false);
    }

    process.exit(1);
  }
};

// ------------ Graceful Shutdown Handlers ------------

/**
 * Handle SIGTERM
 * Performs graceful shutdown to finish in-flight requests
 */
process.on('SIGTERM', async () => {
  server.log.info('SIGTERM received, starting graceful shutdown...');

  if (server.updateServiceHealth) {
    server.updateServiceHealth(false);
  }

  try {
    await server.close();
    server.log.info('Server closed successfully');
    process.exit(0);
  } catch (err) {
    server.log.error(err, 'Error during graceful shutdown');
    process.exit(1);
  }
});

/**
 * Handle SIGINT (Ctrl+C in terminal)
 * Same graceful shutdown as SIGTERM
 */
process.on('SIGINT', async () => {
  server.log.info('SIGINT received, starting graceful shutdown...');

  if (server.updateServiceHealth) {
    server.updateServiceHealth(false);
  }

  try {
    await server.close();
    server.log.info('Server closed successfully');
    process.exit(0);
  } catch (err) {
    server.log.error(err, 'Error during graceful shutdown');
    process.exit(1);
  }
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (err) => {
  server.log.fatal(err, 'Uncaught exception - forcing shutdown');

  if (server.updateServiceHealth) {
    server.updateServiceHealth(false);
  }

  process.exit(1);
});

/**
 * Handle unhandled promise rejections
 * Catches async errors that weren't caught in try/catch
 */
process.on('unhandledRejection', (reason, promise) => {
  server.log.error({ reason, promise }, 'Unhandled promise rejection');

  if (isProduction) {
    server.log.fatal('Exiting due to unhandled rejection in production');
    process.exit(1);
  }
});

// ------------ Start the Server ------------
start();
