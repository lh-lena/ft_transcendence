import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import cron from 'node-cron';

export default fp(async (fastify: FastifyInstance) => {
  const task = cron.schedule('*/5 * * * *', async () => {
    fastify.cleanupExpiredSession();
  });

  fastify.addHook('onClose', async () => {
    task.stop();
  });
});
