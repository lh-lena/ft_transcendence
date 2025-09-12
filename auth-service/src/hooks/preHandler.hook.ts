import fp from 'fastify-plugin';
import { FastifyRequest, FastifyReply } from 'fastify';

import type { JwTPayloadType } from '../schemas/jwt';
import { isBlacklistedToken } from '../utils/blacklistToken';

export default fp(async function onRequestHook(server) {
  server.addHook('preHandler', async (req: FastifyRequest, reply: FastifyReply) => {
    const publicRoutes = [
      '/api/auth/health',
      '/api/auth/google',
      '/api/auth/google/callback',
      '/api/register',
      '/api/login',
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

    if (await isBlacklistedToken(token)) {
      return reply.code(401).send({ error: 'Token revoked' });
    }

    try {
      //TODO find out why
      //@ts-expect-error i don't know
      const decoded: JwTPayloadType = server.verifyAccessToken(token);
      req.user = decoded;
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorised' });
    }
  });
});
