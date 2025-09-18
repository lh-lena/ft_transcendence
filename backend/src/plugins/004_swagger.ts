import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

import FastifySwagger from '@fastify/swagger';
import FastifySwaggerUi from '@fastify/swagger-ui';

const openAiPlugin = async (server: FastifyInstance) => {
  await server.register(FastifySwagger, {
    openapi: {
      info: {
        title: 'transendence API Docs',
        description: 'Auto-generated OpenAPI docs for Transendence.',
        version: '1.0.0',
      },
    },
  });

  await server.register(FastifySwaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
    transformSpecification: (swaggerObject) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });
};

export default fp(openAiPlugin);
