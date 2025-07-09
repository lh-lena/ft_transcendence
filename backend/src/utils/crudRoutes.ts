import { FastifyInstance } from 'fastify';
import { FastifyPluginAsync } from 'fastify';

import { contextFactory } from '../utils/contextFactory';

interface CrudRoutesOptions {
  basePath: string;
  entityName: string;
  controller: {
    getAllorFiltered: Function;
    getById: Function;
    create: Function;
    update: Function;
    delete: Function;
  };
  contextFactory: ( request: any ) => any;
}

const crudRoutes: FastifyPluginAsync<CrudRoutesOptions> = async ( server: FastifyInstance, options ) => {
  const {
    basePath,
    entityName,
    controller,
    contextFactory
  } = options;

  server.get( basePath, {
    schema: {
      querystring: { $ref: `${entityName}Query` },
      response: {
        200: { $ref: `${entityName}ResponseArray` },
      },
      summary: `Get all or filtered ${basePath}`,
    },
    handler: async ( request, reply ) => {
      const context = contextFactory( server.db, server.config );
     return await controller.getAllorFiltered( context, request.query );
    }
  });

  server.get( `${basePath}/:id`, {
    schema: {
      params: { $ref: `${entityName}Id` },
      response: {
      200: { $ref: `${entityName}Response` },
      404: { $ref: `NotFound` },
      },
      summary: `Get ${entityName} by ID`,
    },
    handler: async ( request, reply ) => {
      const context = contextFactory( server.db, server.config );
      return await controller.getById( context, request.params.id );
    }
  });

  server.post( basePath, {
    schema: {
      body: { $ref: `${entityName}Create` },
      response: {
        201: { $ref: `${entityName}Response` },
        400: { $ref: `BadRequest` },
      },
      summary: `Create a new ${entityName}`,
    },
    handler: async ( request, reply ) => {
      const context = contextFactory( server.db, server.config );
      return await controller.create( context, request.body );
    }
  });

  server.patch( `${basePath}/:id`, {
    schema: {
      params: { $ref: `${entityName}Id` },
      body: { $ref: `${entityName}Update` },
      response: {
        200: { $ref: `${entityName}Response` },
        404: { $ref: `NotFound` },
        400: { $ref: `BadRequest` },
      },
      summary: `Update ${entityName} by ID`,
      },
      handler: async ( request, reply ) => {
        const context = contextFactory( server.db, server.config );
        const user = await controller.update( context, request.params.id, request.body );
        return user;
      }
  });

  server.delete( `${basePath}/:id`, {
    schema: {
      params: { $ref: `${entityName}Id` },
      response: {
      200: { $ref: `${entityName}Delete` },
      404: { $ref: `NotFound` },
      },
      summary: `Delete ${entityName} by ID`,
    },
    handler: async ( request, reply ) => {
      const context = contextFactory( server.db, server.config );
      return await controller.remove( context, request.params.id );
    }
  });
};

export default crudRoutes;
