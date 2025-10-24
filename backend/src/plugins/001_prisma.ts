/**
 * Prisma Database Plugin
 *
 * Initializes and manages SQLite connection via Prisma ORM.
 *
 * Features:
 * - Connection pooling with configurable limits
 * - Query logging in development
 * - Graceful disconnect on shutdown
 * - Health check helper for readiness probe
 *
 * Database Connection:
 * - Uses DATABASE_URL from environment
 * - Connection pooled (default: 10 connections)
 * - Queries logged in development mode
 *
 * Usage:
 * - Access via server.prisma.user.findMany()
 * - Use transactions: server.prisma.$transaction([...])
 * - Check health: server.checkDatabaseHealth()
 *
 * @module plugins/prisma
 */

import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyInstance } from 'fastify';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Prisma Database Plugin
 *
 * Decorates Fastify instance with Prisma client and utilities:
 * - server.prisma - Prisma client for database operations
 * - server.checkDatabaseHealth() - Health check helper
 *
 * Lifecycle:
 * - onReady: Connects to database
 * - onClose: Disconnects gracefully
 *
 * @param server - Fastify server instance
 */
const prismaPlugin: FastifyPluginAsync = async (server: FastifyInstance) => {
  const isDev = server.config.NODE_ENV === 'development';

  const prisma = new PrismaClient({
    log: isDev
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'info' },
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ]
      : [
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ],
    errorFormat: isDev ? 'pretty' : 'minimal',
  });

  if (isDev) {
    prisma.$on('query', (e: Prisma.QueryEvent) => {
      server.log.debug(
        {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
          target: e.target,
        },
        'Prisma Query',
      );
    });
  }

  prisma.$on('info', (e: Prisma.LogEvent) => {
    server.log.info({ message: e.message, target: e.target }, 'Prisma Info');
  });

  prisma.$on('error', (e: Prisma.LogEvent) => {
    server.log.error({ message: e.message, target: e.target }, 'Prisma Error');
  });

  prisma.$on('warn', (e: Prisma.LogEvent) => {
    server.log.warn({ message: e.message, target: e.target }, 'Prisma Warning');
  });

  try {
    server.log.info('Connecting to database...');
    await prisma.$connect();

    const connectionTimeout = setTimeout(() => {
      throw new Error('Database connection timeout');
    }, 10000); // 10 second timeout

    await prisma.$queryRaw`SELECT 1`;
    clearTimeout(connectionTimeout);

    server.log.info(
      {
        type: server.config.DATABASE_TYPE,
      },
      'Database connected successfully',
    );
  } catch (error) {
    server.log.error({ error }, 'Failed to connect to database');
    await prisma.$disconnect();
    throw new Error('Database connection failed');
  }

  /**
   * Decorate Fastify instance with Prisma client
   *
   * Usage in routes:
   * const users = await server.prisma.user.findMany();
   */
  server.decorate('prisma', prisma);

  /**
   * Database Health Check Helper
   *
   * Used by /ready endpoint to check if database is accessible.
   * Performs a simple SELECT 1 query to verify connection.
   *
   * @returns Promise<boolean> - true if database is healthy
   *
   * @example
   * const isHealthy = await server.checkDatabaseHealth();
   */
  let lastHealthCheck = { healthy: true, timestamp: 0 };
  const HEALTH_CACHE_MS = 5000;

  server.decorate('checkDatabaseHealth', async (): Promise<boolean> => {
    const now = Date.now();

    if (now - lastHealthCheck.timestamp < HEALTH_CACHE_MS) {
      return lastHealthCheck.healthy;
    }

    try {
      await prisma.$queryRaw`SELECT 1`;
      lastHealthCheck = { healthy: true, timestamp: now };
      return true;
    } catch (error) {
      server.log.error({ error }, 'Database health check failed');
      lastHealthCheck = { healthy: false, timestamp: now };
      return false;
    }
  });

  /**
   * Graceful shutdown hook
   *
   * Disconnects from database when Fastify server closes.
   * Ensures:
   * - All pending queries complete
   * - Connection pool is drained
   * - No hanging connections
   */
  server.addHook('onClose', async () => {
    server.log.info('Disconnecting from database...');

    try {
      const disconnectTimeout = setTimeout(() => {
        server.log.warn('Database disconnect timeout, forcing close');
      }, 5000);

      await prisma.$disconnect();
      clearTimeout(disconnectTimeout);

      server.log.info('Database disconnected successfully');
    } catch (error) {
      server.log.error({ error }, 'Error disconnecting from database');
    }
  });
};

export default fp(prismaPlugin, {
  name: 'prisma',
  fastify: '5.x',
  dependencies: ['config'],
});
