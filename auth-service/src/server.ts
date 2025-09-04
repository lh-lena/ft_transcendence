import Fastify from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import fastifyCookie from '@fastify/cookie';
import fastifyCsrf from '@fastify/csrf-protection';
import fastifyOauth2 from '@fastify/oauth2';
import { config } from './config/index';

// Routes
import authRoutes from './routes/auth';
import privacyRoutes from './routes/privacy';
import profileRoutes from './routes/profile';
import avatarRoutes from './routes/avatarupload';
import friendsRoutes from './routes/friends';
import statsRoutes from './routes/stats';
import twofaRoutes from './routes/2fa';

const server = Fastify({ logger: true });

// ------------ Plugins ------------
server.register(fastifyMultipart);
server.register(fastifyCookie);
server.register(fastifyCsrf);

twofaRoutes(server);

// ------------ Google OAuth2 ------------
server.register(fastifyOauth2, {
  name: 'googleOAuth2',
  scope: ['profile', 'email'],
  credentials: {
    client: { id: config.googleClientId, secret: config.googleClientSecret },
    auth: fastifyOauth2.GOOGLE_CONFIGURATION,
  },
  startRedirectPath: '/api/auth/google',
  callbackUri: 'http://localhost:8082/api/auth/google/callback',
});

// ------------ Routes ------------
server.get('/api/auth/health', async () => ({
  status: 'ok',
  service: 'auth-service',
  message: 'Auth service running on port 8082',
}));

server.register(authRoutes);
server.register(privacyRoutes);
server.register(profileRoutes);
server.register(avatarRoutes);
server.register(friendsRoutes);
server.register(statsRoutes);

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
