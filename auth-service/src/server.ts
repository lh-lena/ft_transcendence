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

const loggerConfig = isProduction
  ? {
      level: 'info', // Production: info, warn, error only
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
        remove: true, // Remove sensitive data completely
      },
      serializers: {
        req: (req: any) => ({
          method: req.method,
          url: req.url,
          remoteAddress: req.ip,
          // Don't log full headers in production
        }),
        res: (res: any) => ({
          statusCode: res.statusCode,
        }),
      },
    }
  : {
      level: isDevelopment ? 'debug' : 'info',
      transport: {
        target: 'pino-pretty', // Pretty logs for development
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
 * Configured with production-grade logging and security settings
 */
export const server = Fastify({
  logger: loggerConfig,
  requestIdLogLabel: 'requestId', // Track requests across logs
  disableRequestLogging: false,
  requestIdHeader: 'x-request-id', // Support external request ID propagation
  trustProxy: isProduction, // Trust X-Forwarded-* headers in production
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
  // Log error with request context for debugging
  server.log.error(
    {
      err: error,
      requestId: request.id,
      url: request.url,
      method: request.method,
    },
    'Request error occurred',
  );

  // Extract error details safely
  const statusCode = (error as any).statusCode || (error as any).status || 500;

  const errorMessage = (error as any).message || 'Internal Server Error';

  // Don't expose internal error details in production
  const responseMessage =
    isProduction && statusCode === 500 ? 'Internal Server Error' : errorMessage;

  // Send standardized error response
  reply.status(statusCode).send({
    success: false,
    message: responseMessage,
    data: (error as any).data || null,
    // Include request ID for client-side debugging
    requestId: request.id,
  });
});

/**
 * Server lifecycle and plugin registration
 * Loads plugins, routes, and hooks in correct order
 */
const start = async () => {
  try {
    server.log.info('Starting auth service...');

    // ------------ Core Security Plugins ------------

    /**
     * CSRF Protection
     * Protects against Cross-Site Request Forgery attacks
     * Requires session plugin for token storage
     */
    await server.register(fastifyCsrf, {
      sessionPlugin: '@fastify/cookie', // Use cookies for CSRF tokens
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
        prefix: '', // No route prefix for plugins
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
        prefix: '/api', // All routes prefixed with /api
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
    server.log.info(`Upload proxy configured: ${backendHost}:8080`);

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
      // Check if critical dependencies are available
      const checks = {
        server: true,
        config: !!server.config,
        // Add more checks as needed (database, cache, etc.)
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

    // Update service health metric (from metrics plugin)
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
    // Log startup failure
    server.log.fatal(err, 'Failed to start auth service');

    // Update metrics before exit
    if (server.updateServiceHealth) {
      server.updateServiceHealth(false);
    }

    // Exit with error code
    process.exit(1);
  }
};

// ------------ Graceful Shutdown Handlers ------------

/**
 * Handle SIGTERM (Docker/Kubernetes shutdown signal)
 * Performs graceful shutdown to finish in-flight requests
 */
process.on('SIGTERM', async () => {
  server.log.info('SIGTERM received, starting graceful shutdown...');

  // Update metrics to indicate service is shutting down
  if (server.updateServiceHealth) {
    server.updateServiceHealth(false);
  }

  try {
    // Close server (stops accepting new connections, waits for existing)
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
 * Last resort error handler - should rarely trigger if code is correct
 */
process.on('uncaughtException', (err) => {
  server.log.fatal(err, 'Uncaught exception - forcing shutdown');

  if (server.updateServiceHealth) {
    server.updateServiceHealth(false);
  }

  // Force exit after logging (don't wait for graceful shutdown)
  process.exit(1);
});

/**
 * Handle unhandled promise rejections
 * Catches async errors that weren't caught in try/catch
 */
process.on('unhandledRejection', (reason, promise) => {
  server.log.error({ reason, promise }, 'Unhandled promise rejection');

  // In production, exit on unhandled rejection (fail-fast)
  if (isProduction) {
    server.log.fatal('Exiting due to unhandled rejection in production');
    process.exit(1);
  }
});

// ------------ Start the Server ------------
start();
