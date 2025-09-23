import fp from 'fastify-plugin';
import { FastifyRequest, FastifyReply } from 'fastify';

import type { JwTReturnType } from '../schemas/jwt';

export default fp(async function onRequestHook(server) {
  server.addHook('preHandler', async (req: FastifyRequest, reply: FastifyReply) => {
    const publicRoutes = [
      '/api/auth/health',
      '/api/oauth',
      '/api/oauth/callback',
      '/api/register',
      '/api/login',
      '/api/refresh',
      '/api/verify',
      '/api/guest/login',
    ];

    const routePath = req.routeOptions.url || req.url;

    if (!routePath) {
      return reply.code(404).send({ error: 'Route not found' });
    } else if (publicRoutes.includes(routePath)) {
      return;
    }

    const authHeaders = req.headers.authorization;
    if (!authHeaders) {
      return reply.code(401).send({ error: 'Missing Authorisation Headers' });
    }

    const token = authHeaders.split(' ')[1];
    if (!token) {
      return reply.code(401).send({ error: 'Missing Authentication Token' });
    }

    try {
      const decoded: JwTReturnType = await server.verifyAccessToken(token);
      console.log('\n\nUSER VERIFIED\n', decoded, '\n');
      req.user = decoded;
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorised' });
    }
  });
});
