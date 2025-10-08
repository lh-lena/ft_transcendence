import Fastify from 'fastify';
import fastifyCsrf from '@fastify/csrf-protection';
import fastifyHttpProxy from '@fastify/http-proxy';
import * as client from 'prom-client';

import AutoLoad from '@fastify/autoload';
import path from 'path';

export const server = Fastify({ logger: { level: 'trace' } });

server.setErrorHandler((error: unknown, _, reply) => {
  const { status, message, data } = error as { status?: number; message?: string; data?: string };
  if (error && typeof error === 'object') {
    reply.status(status || 500).send({
      success: false,
      message: message || 'Internal Server Error',
      data: data || null,
    });
  } else {
    reply.status(500).send({
      success: false,
      message: message || 'Internal Server Error',
    });
  }
});

// Initialize Prometheus registry
export const register = new client.Registry();

// collect default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// create custom metrics for auth service
export const authServiceHealth = new client.Gauge({
  name: 'auth_service_health',
  help: 'Auth service health status (1 = up, 0 = down)',
  registers: [register],
});

export const loginAttempts = new client.Counter({
  name: 'auth_login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['status'],
  registers: [register],
});

export const registrationCounter = new client.Counter({
  name: 'auth_user_registrations_total',
  help: 'Total number of user registrations',
  labelNames: ['status'],
  registers: [register],
});

// ------------ Start Server ------------
const start = async () => {
  // ------------ Plugins ------------

  await server.register(fastifyCsrf);

  //----------Loader--------------------
  await server.register(AutoLoad, {
    dir: path.join(__dirname, '/plugins'),
  });

  await server.register(AutoLoad, {
    dir: path.join(__dirname, '/routes'),
  });

  await server.register(AutoLoad, {
    dir: path.join(__dirname, '/hooks'),
  });

  server.register(fastifyHttpProxy, {
    upstream: 'http://127.0.0.1:8080/api/upload',
    prefix: '/api/upload',
    http2: false,
  });

  try {
    await server.listen({ port: server.config.port, host: server.config.host });
    server.log.info(`Server listening on ${server.config.host}:${server.config.port}`);
    //  authServiceStatus.set(1);
  } catch (err) {
    server.log.error(err);
    // authServiceStatus.set(0);
    process.exit(1);
  }
};

// graceful shutdown
process.on('SIGTERM', async () => {
  // authServiceStatus.set(0);
  await server.close();
  process.exit(0);
});

start();
