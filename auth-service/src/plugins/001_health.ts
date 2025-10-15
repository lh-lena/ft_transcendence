import fp from 'fastify-plugin';
import * as client from 'prom-client';
import { FastifyInstance } from 'fastify';

/**
 * Prometheus Metrics Plugin
 *
 * Sets up Prometheus metrics collection for monitoring auth service health,
 * including login attempts, registrations, and service status.
 *
 * @decorates {object} metrics - Prometheus metrics registry and collectors
 * @decorates {function} recordLoginAttempt - Records login attempt with status
 * @decorates {function} recordRegistration - Records user registration with status
 * @decorates {function} updateServiceHealth - Updates service health status gauge
 * @decorates {function} updateDbHealth - Updates database health status gauge
 */
const metricsPlugin = async (fastify: FastifyInstance) => {
  // Initialize Prometheus registry for auth service metrics
  const register = new client.Registry();

  // Collect default Node.js metrics (CPU, memory, event loop, etc.)
  client.collectDefaultMetrics({ register });

  /**
   * Gauge metric tracking overall auth service availability
   * 1 = service is healthy, 0 = service is down
   */
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

  /**
   * Records a login attempt outcome
   * @param status - 'success' or 'failed'
   */
  fastify.decorate('recordLoginAttempt', (status: 'success' | 'failed') => {
    loginAttempts.inc({ status });
  });

  /**
   * Records a registration attempt outcome
   * @param status - 'success' or 'failed'
   */
  fastify.decorate('recordRegistration', (status: 'success' | 'failed') => {
    registrationCounter.inc({ status });
  });

  fastify.decorate('updateServiceHealth', (isHealthy: boolean) => {
    authServiceStatus.set(isHealthy ? 1 : 0);
  });

  fastify.decorate('updateDbHealth', (isHealthy: boolean) => {
    dbConnectionStatus.set(isHealthy ? 1 : 0);
  });
  fastify.log.info('Prometheus metrics plugin initialized');
};

export default fp(metricsPlugin, {
  name: 'metrics',
  fastify: '5.x',
});
