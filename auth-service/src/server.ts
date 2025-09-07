import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCsrf from '@fastify/csrf-protection';
import fastifyOauth2 from '@fastify/oauth2';
import { config } from './config/index';
import cronPlugin from './plugins/000_cron';
import authRoutes from './routes/auth';

export const server = Fastify({ logger: true });

// ------------ Plugins ------------
server.register(fastifyCookie);
server.register(fastifyCsrf);
server.register(cronPlugin);

// ------------ Google OAuth2 ------------
server.register(fastifyOauth2, {
  name: 'googleOAuth2',
  scope: ['profile', 'email'],
  credentials: {
    client: { id: config.googleClientId, secret: config.googleClientSecret },
    auth: fastifyOauth2.GOOGLE_CONFIGURATION,
  },
  startRedirectPath: '/api/auth/google',
  callbackUri: 'https://localhost:8082/api/auth/google/callback',
});

// ------------ Routes ------------

server.register(authRoutes);

server.addHook('onRequest', async (req: FastifyRequest, reply: Fastifyreply) => {
  const publicRoutes = [
    '/api/auth/health',
    '/api/auth/google',
    '/api/auth/google/callback',
    '/api/register',
    '/api/login',
  ];

  if (publicRoutes.includes(req.routerPath)) {
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

  if (await isBlacklisted(token)) {
    return reply.code(401).send({ error: 'Token revoked' });
  }

  try {
    const decoded = server.jwt.verify(token);
    req.user = decoded;
  } catch (err) {
    return reply.code(401).send({ error: 'Unauthorised' });
  }
});

// ------------ Start Server ------------
const start = async () => {
  try {
    await server.listen({ port: config.port, host: config.host });
    server.log.info(`Server listening on ${config.host}:${config.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
