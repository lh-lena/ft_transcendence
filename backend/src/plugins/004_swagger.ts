/**
 * Swagger/OpenAPI Documentation Plugin
 *
 * Provides interactive API documentation via Swagger UI.
 * Automatically generates OpenAPI specification from route schemas.
 *
 * Features:
 * - Auto-generated API documentation
 * - Interactive Swagger UI interface
 * - Available at /api/docs endpoint
 *
 * Access:
 * - Swagger UI: http://localhost:3000/api/docs
 * - OpenAPI JSON: http://localhost:3000/api/docs/json
 *
 * @module plugins/swagger
 */

import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

import FastifySwagger from '@fastify/swagger';
import FastifySwaggerUi from '@fastify/swagger-ui';

/**
 * Swagger/OpenAPI Plugin
 *
 * Registers Swagger documentation generation and UI.
 * In production, consider restricting access or disabling UI.
 *
 * @param server - Fastify server instance
 */
const swaggerPlugin = async (server: FastifyInstance) => {
  const { NODE_ENV, ENABLE_SWAGGER } = server.config;
  const isDev = NODE_ENV === 'development';

  if (!ENABLE_SWAGGER) {
    server.log.info('Swagger documentation disabled');
    return;
  }

  await server.register(FastifySwagger, {
    openapi: {
      info: {
        title: 'Transcendence API Documentation',
        description: 'Auto-generated OpenAPI documentation for Transcendence API.',
        version: '1.0.0',
      },
      servers: [
        {
          url: isDev ? 'http://localhost:3000' : 'https://transendence.com',
          description: isDev ? 'Development server' : 'Production server',
        },
      ],
      tags: [
        { name: 'health', description: 'Health check endpoints' },
        { name: 'user', description: 'User management' },
        { name: 'game', description: 'Game operations' },
        { name: 'tournament', description: 'Tournament management' },
        { name: 'result', description: 'Game results and statistics' },
        { name: 'chat', description: 'Chat functionality' },
        { name: 'friend', description: 'Friend relationships' },
        { name: 'blocked', description: 'Blocked users' },
        { name: 'upload', description: 'File uploads' },
        { name: 'auth', description: 'Authentication' },
        { name: 'monitoring', description: 'Metrics and monitoring' },
      ],
    },
  });

  await server.register(FastifySwaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
      displayRequestDuration: true,
      filter: true,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai',
      },
    },
    staticCSP: true,
    transformSpecificationClone: true,
  });

  server.log.info(
    {
      route: '/api/docs',
      environment: NODE_ENV,
    },
    'Swagger UI available at /api/docs',
  );

  if (!isDev) {
    server.log.warn(
      'Swagger UI is enabled in production. Consider adding authentication or disabling it.',
    );
  }
};

export default fp(swaggerPlugin, {
  name: 'swagger',
  fastify: '5.x',
  dependencies: ['schemas', 'config'],
});
