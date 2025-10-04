import fp from 'fastify-plugin';
import { FastifyRequest, FastifyReply } from 'fastify';

import type { JwTReturnType } from '../schemas/jwt';

export default fp(async function onRequestHook(server) {
  server.addHook('preHandler', async (req: FastifyRequest, reply: FastifyReply) => {
    const publicRoutes = [
      '/api/auth/health',
      '/metrics',
      '/api/auth/google',
      '/api/auth/google/callback',
      '/api/register',
      '/api/login',
      '/api/refresh',
      '/api/verify',
      '/api/guest/login',
      '/api/auth/me',
    ];

    console.log(req.headers);

    const routePath = req.routeOptions.url || req.url;
    console.log('\n\nROUTE PATH\n', routePath, '\n');

    if (!routePath) {
      return reply.code(404).send({ error: 'Route not found' });
    } else if (publicRoutes.includes(routePath)) {
      return;
    }

    const token = req.cookies.jwt;
    if (!token) {
      return reply.code(401).send({ error: 'Missing Authorisation Headers' });
    }

    try {
      const decoded: JwTReturnType = await server.verifyAccessToken(token);
      req.user = decoded;
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorised' });
    }
  });
});
