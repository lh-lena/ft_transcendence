import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import swaggerUI from '@fastify/swagger-ui';
import { UserIdJSON } from '../schemas/user.schema.js';
import { fastifySwagger, SwaggerOptions } from '@fastify/swagger';

const docsPlugin: FastifyPluginCallback = async (app: FastifyInstance) => {
  app.register(fastifySwagger, {
    mode: 'dynamic',
    openapi: {
      info: {
        title: 'ft_transcendence API',
        description:
          'API documentation for the WebSocket and REST endpoints of the ft_transcendence project.',
        version: '1.0.0',
      },
      parameters: [
        {
          name: 'token',
          in: 'query',
          required: true,
          description: 'JWT token for WebSocket authentication',
          schema: {
            type: 'string',
            format: 'jwt',
          },
        },
      ],
      servers: [
        { url: 'ws://localhost:8081', description: 'WebSocket Server' },
        { url: 'http://localhost:8081', description: 'REST API Server' },
      ],
      components: {
        schemas: {
          UserIdJSON,
        },
      },
      paths: {
        '/ws?token={token}': {
          get: {
            summary: 'WebSocket Entry Point',
            description:
              'Establishes a WebSocket connection for real-time game and chat communication',
            tags: ['WebSocket'],
            parameters: [
              {
                name: 'token',
                in: 'query',
                required: true,
                description: 'JWT token for WebSocket authentication',
                schema: {
                  type: 'string',
                  format: 'jwt',
                },
              },
            ],
            responses: {
              connected: {
                description: 'WebSocket connection established',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/UserIdJSON' },
                  },
                },
              },
              '401': {
                description: 'Unauthorized',
              },
              '500': {
                description: 'Internal Server Error',
              },
              '1000': {
                description: 'Normal Closure | Replaced by new connection',
              },
              '1001': {
                description: 'Realtime server is shutting down',
              },
              '1007': {
                description: 'Invalid Payload',
              },
              '1011': {
                description: 'Connection lost | Internal Server Error | Max connections reached',
              },
            },
          },
        },
      },
    },
  } as SwaggerOptions);

  await app.register(swaggerUI, {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });
};

export default fp(docsPlugin, {
  name: 'docs-plugin',
});
