import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import cron from 'node-cron';
import tfa from '../routes/auth';

export default fp(async (fastify: FastifyInstance) => {
  const task = cron.schedule('*/5 * * * *', async () => {
    tfa.cleanupExpiredSessions();
  });

  fastify.addHook('onClose', async () => {
    task.stop();
  });
});
