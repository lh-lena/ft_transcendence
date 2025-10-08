import { FastifyInstance, FastifyReply } from 'fastify';
import { register, authServiceHealth } from '../server';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/api/auth/health', async (_, reply: FastifyReply) => {
    //    const healthChecks = await Promise.allSettled([
    //     checkDatabase(fastify),
    //     checkExternalDependencies(fastify),
    //   ]);
    //
    const healthRoute = async (server: FastifyInstance) => {
      // Health check endpoint
      server.get('/api/auth/health', async () => {
        // Update metrics
        authServiceHealth.set(1); // service is up if this endpoint responds

        return {
          status: 'ok',
          service: 'auth-service',
          message: 'Auth service running on port 8082',
          timestamp: new Date().toISOString(),
        };
      });

      // Prometheus metrics endpoint
      server.get('/metrics', async (_request: FastifyRequest, reply: FastifyReply) => {
        try {
          const metrics = await register.metrics();
          reply.header('Content-Type', register.contentType).code(200).send(metrics);
        } catch (err) {
          server.log.error('Error generating metrics:', err);
          reply.code(500).send({ error: 'Failed to generate metrics' });
        }
      });
    };

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
