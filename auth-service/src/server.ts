import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCsrf from '@fastify/csrf-protection';
import fastifyOauth2 from '@fastify/oauth2';

import cronPlugin from './plugins/000_cron';
import AutoLoad from '@fastify/autoload';
import path from 'path';

import { config } from './config/index';

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
  callbackUri: 'http://localhost:8082/api/auth/google/callback',
});

//----------Loader--------------------
server.register(AutoLoad, {
  dir: path.join(__dirname, '/routes'),
});

server.register(AutoLoad, {
  dir: path.join(__dirname, '/hooks'),
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
