/**
 * Configuration Plugin
 *
 * Loads and validates environment variables.
 * Makes configuration available throughout the application.
 *
 * Features:
 * - Type-safe environment variables
 * - Validation on startup
 * - Default values
 * - Runtime configuration access
 * - SQLite and PostgreSQL support
 *
 * @module plugins/config
 */

import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import fastifyEnv from '@fastify/env';

const schema = {
  type: 'object',
  required: ['DATABASE_URL'],
  properties: {
    NODE_ENV: {
      type: 'string',
      default: 'development',
    },
    PORT: {
      type: 'integer',
      default: 8080,
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
    DATABASE_URL: {
      type: 'string',
    },
    DATABASE_TYPE: {
      type: 'string',
      default: 'sqlite',
    },
    AVATAR_DIR: {
      type: 'string',
      default: './public/avatars',
    },
    MAX_FILE_SIZE: {
      type: 'integer',
      default: 10485760, // 10MB
    },
    MAX_FILES: {
      type: 'integer',
      default: 1,
    },
    MAX_FIELD_SIZE: {
      type: 'integer',
      default: 1048576, // 1MB
    },
    MAX_FIELDS: {
      type: 'integer',
      default: 10,
    },
    UPLOAD_DIR: {
      type: 'string',
      default: './public/avatars',
    },
    REALTIME_IP: {
      type: 'string',
      default: 'realtime',
    },
    REALTIME_PORT: {
      type: 'string',
      default: '8081',
    },
    REALTIME_TIMEOUT: {
      type: 'integer',
      default: 5000,
    },
    REALTIME_RETRY_ATTEMPTS: {
      type: 'integer',
      default: 3,
    },
    LEADERBOARD_SIZE: {
      type: 'integer',
      default: 8,
    },
    ENABLE_SWAGGER: {
      type: 'boolean',
      default: false,
    },
    ENABLE_METRICS: {
      type: 'boolean',
      default: false,
    },
    SLOW_REQUEST_THRESHOLD: {
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
  await server.register(fastifyEnv, {
    confKey: 'config',
    schema: schema,
    dotenv: true,
    data: process.env,
  });

  server.log.info('Configuration loaded');
};

export default fp(configPlugin, {
  name: 'config',
  fastify: '5.x',
});
