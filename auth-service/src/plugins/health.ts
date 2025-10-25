import fp from 'fastify-plugin';
import * as client from 'prom-client';
import { FastifyInstance } from 'fastify';

const metricsPlugin = async (fastify: FastifyInstance) => {
  const register = new client.Registry();

  client.collectDefaultMetrics({ register });

  const authServiceStatus = new client.Gauge({
    name: 'auth_service_status',
    help: 'Auth service status (1 = up, 0 = down)',
    registers: [register],
  });

  const dbConnectionStatus = new client.Gauge({
    name: 'auth_db_connection_status',
    help: 'Auth database connection status (1 = up, 0 = down)',
    registers: [register],
  });

  const loginAttempts = new client.Counter({
    name: 'auth_login_attempts_total',
    help: 'Total number of login attempts',
    labelNames: ['status'],
    registers: [register],
  });

  const registrationCounter = new client.Counter({
    name: 'auth_user_registrations_total',
    help: 'Total number of user registrations',
    labelNames: ['status'],
    registers: [register],
  });

  fastify.decorate('metrics', {
    authServiceStatus,
    dbConnectionStatus,
    loginAttempts,
    registrationCounter,
    register,
  });

  if (fastify.config.ENABLE_METRICS) {
    fastify.decorate('recordLoginAttempt', (status: 'success' | 'failed') => {
      loginAttempts.inc({ status });
    });

    fastify.decorate('recordRegistration', (status: 'success' | 'failed') => {
      registrationCounter.inc({ status });
    });

    fastify.decorate('updateServiceHealth', (isHealthy: boolean) => {
      authServiceStatus.set(isHealthy ? 1 : 0);
    });

    fastify.decorate('updateDbHealth', (isHealthy: boolean) => {
      dbConnectionStatus.set(isHealthy ? 1 : 0);
    });
  }

  fastify.log.info('Prometheus metrics plugin initialized');
};

export default fp(metricsPlugin, {
  name: 'metrics',
  fastify: '5.x',
  dependencies: ['config'],
});
