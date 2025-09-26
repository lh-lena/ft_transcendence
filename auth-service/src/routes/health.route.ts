import { FastifyInstance, FastifyReply } from 'fastify';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/api/auth/health', async (_, reply: FastifyReply) => {
    //    const healthChecks = await Promise.allSettled([
    //     checkDatabase(fastify),
    //     checkExternalDependencies(fastify),
    //   ]);

    //const dbCheck = healthChecks[0];
    //const externalCheck = healthChecks[1];

    //const isHealthy = dbCheck.status === 'fulfilled' && externalCheck.status === 'fulfilled';
    const isHealthy = true;
    const statusCode = isHealthy ? 200 : 503;
    // Update metrics
    fastify.updateServiceHealth(isHealthy);
    //fastify.updateDbHealth(dbCheck.status === 'fulfilled');

    const response = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'auth-service',
      version: process.env.SERVICE_VERSION || 'unknown',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks: {
        //database: {
        //  status: dbCheck.status === 'fulfilled' ? 'up' : 'down',
        //  error: dbCheck.status === 'rejected' ? dbCheck.reason?.message : undefined,
        //},
        //external: {
        //  status: externalCheck.status === 'fulfilled' ? 'up' : 'down',
        //  error: externalCheck.status === 'rejected' ? externalCheck.reason?.message : undefined,
        //},
      },
    };

    return reply.code(statusCode).send(response);
  });
}

//async function checkDatabase(fastify: FastifyInstance): Promise<void> {
//  // Add timeout to prevent hanging
//  return new Promise((resolve, reject) => {
//    const timeout = setTimeout(() => reject(new Error('Database check timeout')), 5000);
//
//    try {
//      fastify.db.prepare('SELECT 1').get();
//      clearTimeout(timeout);
//      resolve();
//    } catch (err) {
//      clearTimeout(timeout);
//      reject(err);
//    }
//  });
//}

//async function checkExternalDependencies(fastify: FastifyInstance): Promise<void> {
//  // Check other services, Redis, etc.
//  return Promise.resolve();
//}
