import fp from 'fastify-plugin';
import fastifyHttpProxy from '@fastify/http-proxy';
import { FastifyRequest, FastifyReply } from 'fastify';

import type { JwTReturnType } from '../schemas/jwt';
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
      const decoded: JwTReturnType = await server.verifyAccessToken(token);
      req.user = decoded;
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorised' });
    }
  });

  server.register(fastifyHttpProxy, {
    upstream: 'http://backend:8080/api/upload',
    prefix: '/api/upload',
    http2: false,
  });
});
