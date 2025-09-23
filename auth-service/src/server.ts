import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifyCsrf from '@fastify/csrf-protection';
import fastifyHttpProxy from '@fastify/http-proxy';
//import * as client from 'prom-client';

import AutoLoad from '@fastify/autoload';
import path from 'path';

//import { da } from 'zod/v4/locales';

// Initialize Prometheus registry
//const register = new client.Registry();
//
//// collect default metrics (CPU, memory, etc.)
//client.collectDefaultMetrics({ register });
//
//// create custom metrics for auth service
//const authServiceStatus = new client.Gauge({
//  name: 'auth_service_status',
//  help: 'Auth service status (1 = up, 0 = down)',
//  registers: [register],
//});
//
//const dbConnectionStatus = new client.Gauge({
//  name: 'auth_db_connection_status',
//  help: 'Auth database connection status (1 = up, 0 = down)',
//  registers: [register],
//});
//
//const loginAttempts = new client.Counter({
//  name: 'auth_login_attempts_total',
//  help: 'Total number of login attempts',
//  labelNames: ['status'],
//  registers: [register],
//});
//
//const registrationCounter = new client.Counter({
//  name: 'auth_user_registrations_total',
//  help: 'Total number of user registrations',
//  labelNames: ['status'],
//  registers: [register],
//});
//
//type User = {
//  id: number;
//  email: string;
//  username: string;
//  alias?: string;
//  password_hash: string;
//  is_2fa_enabled: number;
//  twofa_secret?: string | null;
//  created_at: string;
//  updated_at: string;
//};

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

//// Health check endpoint with metrics update
//server.get('/api/auth/health', async (request, reply) => {
//  let dbStatus = 'down';
//  let dbStatusCode = 0;
//
//  try {
//    // test database connection
//    db.prepare('SELECT 1').get();
//    dbStatus = 'up';
//    dbStatusCode = 1;
//  } catch (err) {
//    server.log.error('Database health check failed:', err);
//    dbStatus = 'down';
//    dbStatusCode = 0;
//  }
//
//  // update metrics
//  authServiceStatus.set(1); // service is up if this endpoint responds
//  dbConnectionStatus.set(dbStatusCode);
//
//  return {
//    status: 'ok',
//    service: 'auth-service',
//    message: 'Auth service running on port 8082',
//    dbStatus: dbStatus,
//    timestamp: new Date().toISOString(),
//  };
//});
//
//// prometheus metrics endpoint
//server.get('/metrics', async (request, reply) => {
//  try {
//    const metrics = await register.metrics();
//    reply.header('Content-Type', register.contentType).code(200).send(metrics);
//  } catch (err) {
//    server.log.error('Error generating metrics:', err);
//    reply.code(500).send({ error: 'Failed to generate metrics' });
//  }
//});
//
//// registration endpoint with metrics
//server.post('/api/auth/register', async (request, reply) => {
//  const { email, username, password, alias } = request.body as {
//    email?: string;
//    username?: string;
//    password?: string;
//    alias?: string;
//  };
//
//  if (!email || !username || !password) {
//    registrationCounter.inc({ status: 'failed' });
//    return reply.status(400).send({ error: 'Email, username, and password are required.' });
//  }
//  if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(email)) {
//    registrationCounter.inc({ status: 'failed' });
//    return reply.status(400).send({ error: 'Invalid email format.' });
//  }
//  if (username.length < 3 || username.length > 32) {
//    registrationCounter.inc({ status: 'failed' });
//    return reply.status(400).send({ error: 'Username must be 3-32 characters.' });
//  }
//  if (password.length < 6) {
//    registrationCounter.inc({ status: 'failed' });
//    return reply.status(400).send({ error: 'Password must be at least 6 characters.' });
//  }
//
//  // 2. Check if email or username already exists
//  const exists = db
//    .prepare('SELECT id FROM user WHERE email = ? OR username = ?')
//    .get(email, username);
//  if (exists) {
//    registrationCounter.inc({ status: 'failed' });
//    return reply.status(409).send({ error: 'Email or username already in use.' });
//  }
//
//  let password_hash: string;
//  try {
//    password_hash = await hashPassword(password);
//  } catch (err) {
//    server.log.error(err);
//    registrationCounter.inc({ status: 'failed' });
//    return reply.status(500).send({ error: 'Failed to hash password.' });
//  }
//
//  try {
//    db.prepare('INSERT INTO user (email, username, password_hash) VALUES (?, ?, ?)').run(
//      email,
//      username,
//      password_hash,
//    );
//    registrationCounter.inc({ status: 'success' });
//  } catch (err) {
//    server.log.error(err);
//    registrationCounter.inc({ status: 'failed' });
//    return reply.status(500).send({ error: 'Failed to create user.' });
//  }
//
//  return reply.status(201).send({ message: 'User registered successfully.' });
//});
//
//// Login endpoint with metrics
//server.post('/api/auth/login', async (request, reply) => {
//  const { email, password } = request.body as { email?: string; password?: string };
//
//  if (!email || !password) {
//    loginAttempts.inc({ status: 'failed' });
//    return reply.status(400).send({ error: 'Email and password are required.' });
//  }
//
//  const user = db.prepare('SELECT * FROM user WHERE email = ?').get(email) as User | undefined;
//  if (!user) {
//    loginAttempts.inc({ status: 'failed' });
//    return reply.status(401).send({ error: 'Invalid credentials.' });
//  }
//
//  const valid = await verifyPassword(user.password_hash, password);
//  if (!valid) {
//    loginAttempts.inc({ status: 'failed' });
//    return reply.status(401).send({ error: 'Invalid credentials.' });
//  }
//
//  loginAttempts.inc({ status: 'success' });
//
//  const token = generateJWT({
//    sub: user.id,
//    username: user.username,
//    email: user.email,
//    alias: user.alias,
//    is_2fa_enabled: user.is_2fa_enabled,
//  });
//
//  return reply.send({ token });
//});

// ------------ Start Server ------------
const start = async () => {
  // ------------ Plugins ------------

  await server.register(fastifyCookie);
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

  await server.register(cors, {
    //TODO set to frontend
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  server.register(fastifyHttpProxy, {
    upstream: 'http://127.0.0.1:8080/api/upload',
    prefix: '/api/upload',
    http2: false,
  });

  // ------------ OAuth2 ------------

  try {
    await server.listen({ port: server.config.port, host: server.config.host });
    server.log.info(`Server listening on ${server.config.host}:${server.config.port}`);
    //await server.listen({ port: 8082, host: '0.0.0.0' });
    // set service status to up when server starts successfully
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
