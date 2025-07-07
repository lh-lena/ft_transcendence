import { FastifyInstance } from 'fastify';
import { ServerContext } from '../context';
//import { fastifyZod } from 'fastify-zod';
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'


export function openAiDocs(context: ServerContext) {
  return async function( server: FastifyInstance ) {

	await context.server.register(swagger, {
	  openapi: {
	    info: {
	      title: 'API Documentation',
	      description: 'Auto-generated OpenAPI docs for Transendence.',
	      version: '1.0.0',
	    },
	  },
	});
	
	await context.server.register(swaggerUi, {
	  routePrefix: '/docs',
	  uiConfig: {
	    docExpansion: 'list',
	    deepLinking: false,
	    },
	  });

    //await context.server.register( fastifyZod );
  }
}
