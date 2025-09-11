import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import cron from 'node-cron';
import { cleanupExpiredSession } from '../routes/auth.route';

export default fp(async (fastify: FastifyInstance) => {
  const task = cron.schedule('*/5 * * * *', async () => {
    cleanupExpiredSession();
  });

  fastify.addHook('onClose', async () => {
    task.stop();
  });
});
