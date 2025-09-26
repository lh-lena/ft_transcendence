import fp from 'fastify-plugin';
import * as client from 'prom-client';
import { FastifyInstance } from 'fastify';

const metricsPlugin = async (fastify: FastifyInstance) => {
  // Initialize Prometheus registry
  const register = new client.Registry();

  // Collect default metrics (CPU, memory, etc.)
  client.collectDefaultMetrics({ register });

  // Create custom metrics for auth service
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

  // Decorate fastify with metrics methods
  fastify.decorate('metrics', {
    authServiceStatus,
    dbConnectionStatus,
    loginAttempts,
    registrationCounter,
    register,
  });

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
};

export default fp(metricsPlugin);
