/**
 * Backend Service - Main Entry Point
 *
 * Internal API service behind auth-service proxy.
 * Handles business logic, database operations, and file storage.
 *
 * Architecture:
 * nginx → frontend → auth-service → backend (this service)
 *
 * @module server
 */

import Fastify from 'fastify';
import autoLoad from '@fastify/autoload';
import path from 'path';
import { LoggerOptions } from 'pino';
import { fileURLToPath } from 'url';

// ESM dirname compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        err: (err) => ({
          type: err.type,
          message: err.message?.replace(/\\n/g, '\n').replace(/\\t/g, '\t'),
          stack: err.stack,
          target: err.meta?.target,
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
      serializers: {
        err: (err) => ({
          type: err.type,
          message: err.message?.replace(/\\n/g, '\n').replace(/\\t/g, '\t'),
          stack: err.stack,
          target: err.meta?.target,
        }),
      },
    };

/**
 * Initialize Fastify server
 */
export const server = Fastify({
  logger: loggerConfig,
  requestIdLogLabel: 'requestId',
  disableRequestLogging: false,
  genReqId: (req) => req.headers['x-request-id']?.toString() || crypto.randomUUID(),
  requestIdHeader: 'x-request-id',
  trustProxy: isProduction,
  bodyLimit: 1048576,
  connectionTimeout: 10000,
  keepAliveTimeout: 5000,
});

/**
 * Server lifecycle and plugin registration
 * Loads plugins and routes in correct order
 */
const start = async () => {
  server.log.info('Starting backend service...');
  try {
    // ------------ Auto-load Plugins ------------

    await server.register(autoLoad, { dir: path.join(__dirname, 'plugins') });
    server.log.info({ pluginDir: path.join(__dirname, 'plugins') }, 'Plugins loaded');

    // ------------ Auto-load Hooks ------------

    // ------------ Auto-load Routes ------------

    await server.register(autoLoad, {
      dir: path.join(__dirname, 'routes'),
      dirNameRoutePrefix: true,
      options: { prefix: '/api' },
    });
    server.log.info({ routeDir: path.join(__dirname, 'routes') }, 'Routes loaded');

    // ------------ Log Routes ------------

    if (server.config.NODE_ENV !== 'production') {
      server.log.info('Registered routes:');
      server.log.info(
        server.printRoutes({
          commonPrefix: true,
          includeHooks: false,
        }),
      );
    }

    // ------------ Start Listening ------------

    await server.listen({
      port: server.config.PORT,
      host: server.config.HOST,
    });

    server.log.info(
      {
        port: server.config.PORT,
        host: server.config.HOST,
        environment: server.config.NODE_ENV,
      },
      'Backend service started successfully',
    );
  } catch (err) {
    server.log.fatal({ err }, 'Failed to start backend service');
    process.exit(1);
  }
};

// ------------ Gracefull Shutdown ------------

/**
 * Graceful shutdown helper
 *
 * Closes server and waits for in-flight requests with timeout.
 *
 * @param signal - Signal name (SIGTERM, SIGINT, etc.)
 * @returns Promise that resolves when shutdown complete
 */
async function gracefulShutdown(signal: string): Promise<void> {
  server.log.info({ signal }, 'Shutdown signal received, starting shutdown...');

  const shutdownTimer = setTimeout(() => {
    server.log.error(
      { timeout: server.config.SHUTDOWN_TIMEOUT },
      'Graceful shutdown timeout exceeded, forcing exit',
    );
    process.exit(1);
  }, server.config.SHUTDOWN_TIMEOUT);

  try {
    await server.close();
    clearTimeout(shutdownTimer);
    server.log.info('Server closed successfully');
    process.exit(0);
  } catch (err) {
    clearTimeout(shutdownTimer);
    server.log.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
}

// ------------ Gracefull Shutdown ------------

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ------------ Handle uncaught Errors ------------
//
process.on('uncaughtException', (err) => {
  server.log.fatal({ err }, 'Uncaught exception - forcing shutdown');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  server.log.error({ reason, promise }, 'Unhandled rejection');

  if (server.config.NODE_ENV === 'production') {
    server.log.fatal('Exiting due to unhandled rejection in production');
    process.exit(1);
  }
});

process.on('warning', (warning) => {
  server.log.warn(
    {
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
    },
    'Process warning',
  );
});

// ------------ START ------------

start();
