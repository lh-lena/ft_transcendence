/**
 * Configuration Plugin
 *
 * Loads and validates environment variables.
 * Makes configuration available throughout the application.
 *
 * @module plugins/config
 */

import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import fastifyEnv from '@fastify/env';

const schema = {
  type: 'object',
  required: ['ACCESS_SECRET', 'REFRESH_SECRET', 'OAUTH_CLIENT_ID', 'OAUTH_SECRET'],
  properties: {
    NODE_ENV: {
      type: 'string',
      default: 'development',
    },
    PORT: {
      type: 'integer',
      default: 8082,
      minimum: 1,
      maximum: 65535,
    },
    HOST: {
      type: 'string',
      default: '0.0.0.0',
    },
    SHUTDOWN_TIMEOUT: {
      type: 'integer',
      default: 30000,
    },
    ACCESS_SECRET: {
      type: 'string',
    },
    REFRESH_SECRET: {
      type: 'string',
    },
    OAUTH_CLIENT_ID: {
      type: 'string',
    },
    OAUTH_SECRET: {
      type: 'string',
    },
    FRONTEND_URL: {
      type: 'string',
      default: 'http://localhost:3000',
    },
    REALTIME_URL: {
      type: 'string',
      default: 'http://realtime:8081',
    },
    BACKEND_URL: {
      type: 'string',
      default: 'http://backend:8080',
    },
    AUTH_URL: {
      type: 'string',
      default: 'http://localhost:8082',
    },
    ENABLE_METRICS: {
      type: 'boolean',
      default: false,
    },
    SLOW_REQUEST_TIME: {
      type: 'integer',
      default: 1000,
    },
    LOG_LEVEL: {
      type: 'string',
      default: 'info',
    },
  },
};

const configPlugin: FastifyPluginAsync = async (server) => {
  // debug by alec
  server.log.info({
    ACCESS_SECRET: process.env.ACCESS_SECRET ? 'SET' : 'MISSING',
    REFRESH_SECRET: process.env.REFRESH_SECRET ? 'SET' : 'MISSING',
    OAUTH_CLIENT_ID: process.env.OAUTH_CLIENT_ID ? 'SET' : 'MISSING',
    OAUTH_SECRET: process.env.OAUTH_SECRET ? 'SET' : 'MISSING',
  }, 'Environment variables before @fastify/env');


  await server.register(fastifyEnv, {
    confKey: 'config',
    schema: schema,
    // changed by alec -> dont need since docker alr sets this
    dotenv: false,
    // data: process.env,
  });
  server.log.info('Configuration loaded successfully');
};

export default fp(configPlugin, {
  name: 'config',
  fastify: '5.x',
});
