import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

const openAiPlugin = async ( server: FastifyInstance ) => {

	await server.register(swagger, {
	  openapi: {
	    info: {
	      title: 'transendence API Docs',
	      description: 'Auto-generated OpenAPI docs for Transendence.',
	      version: '1.0.0',
	    },
	  },
	});
	
	await server.register(swaggerUi, {
	  routePrefix: 'api/docs',
	  uiConfig: {
	    docExpansion: 'list',
	    deepLinking: false,
	    },
    staticCSP: true,
    transformSpecification: ( swaggerObject, request, reply ) => {
      return swaggerObject;
			},
      transformSpecificationClone: true,
  });

}

export default fp( openAiPlugin );
