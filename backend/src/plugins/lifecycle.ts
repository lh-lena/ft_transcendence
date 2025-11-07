/**
 * Lifecycle Plugin - Application Lifecycle Management
 *
 * Handles shutdown, and cleanup operations.
 * Ensures proper resource cleanup and state management during graceful shutdown.
 */

import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const lifecyclePlugin: FastifyPluginAsync = async (server) => {
  /**
   * Set all users to offline status
   * Called during graceful shutdown
   */
  async function setAllUsersOffline(): Promise<void> {
    const startTime = Date.now();

    try {
      server.log.info('Setting all users to offline status...');

      const result = await server.prisma.user.updateMany({
        where: {
          online: true,
        },
        data: {
          online: false,
        },
      });

      const duration = Date.now() - startTime;

      server.log.info(
        {
          usersUpdated: result.count,
          duration: `${duration}ms`,
        },
        'All users set to offline successfully',
      );
    } catch (error) {
      server.log.error({ err: error }, 'Failed to set users offline during shutdown');
    }
  }

  /**
   * Master cleanup function
   * Orchestrates all cleanup tasks in correct order
   */
  async function performCleanup(): Promise<void> {
    server.log.info('Starting application cleanup...');

    const cleanupStart = Date.now();

    await Promise.allSettled([setAllUsersOffline()]);

    const cleanupDuration = Date.now() - cleanupStart;

    server.log.info({ duration: `${cleanupDuration}ms` }, 'Application cleanup completed');
  }

  server.addHook('onClose', async (instance) => {
    instance.log.info('onClose hook triggered - performing cleanup');
    await performCleanup();
  });

  server.log.info('Lifecycle plugin registered');
};

export default fp(lifecyclePlugin, {
  name: 'lifecycle',
  dependencies: ['prisma'],
});
