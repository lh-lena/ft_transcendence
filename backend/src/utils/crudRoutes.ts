import { FastifyInstance } from 'fastify';
import { FastifyPluginAsync } from 'fastify';

interface CrudRoutesOptions {
  basePath: string;
  entityName: string;
  controller: {
    getAllorFiltered?: Function;
    getById?: Function;
    create?: Function;
    update?: Function;
    delete?: Function;
  };
  routes?: Array< 'getAll' | 'getById' | 'create' | 'update' | 'delete' >;
};

const crudRoutes: FastifyPluginAsync<CrudRoutesOptions> = async ( server: FastifyInstance, options ) => {
  const {
    basePath,
    entityName,
    controller,
    routes = [ 'getAll', 'getById', 'create', 'update', 'delete' ],
  } = options;

  if( routes.includes( 'getAll' ) && controller.getAllorFiltered ){
  server.get( basePath, {
    schema: {
      querystring: { $ref: `${entityName}Query` },
      response: {
        200: { $ref: `${entityName}Array` },
        404: { $ref: `NotFound` },
      },
      summary: `Get all or filtered ${basePath}`,
    },
    handler: async ( request, reply ) => {
      const ret = await controller.getAllorFiltered( request.query );

      return reply.code( 200 ).send( ret );
    }
  });
  }

  if( routes.includes( 'getById' ) && controller.getById ){
  server.get( `${basePath}/:id`, {
    schema: {
      params: { $ref: `${entityName}Id` },
      response: {
      200: { $ref: `${entityName}` },
      404: { $ref: `NotFound` },
      },
      summary: `Get ${entityName} by ID`,
    },
    handler: async ( request, reply ) => {
      const ret = await controller.getById( request.params.id );

      return reply.code( 200 ).send( ret );
    }
  });
  }

  if( routes.includes( 'create' ) && controller.create ){
  server.post( basePath, {
    schema: {
      body: { $ref: `${entityName}Create` },
      response: {
        201: { $ref: `${entityName}` },
        400: { $ref: `BadRequest` },
      },
      summary: `Create a new ${entityName}`,
    },
    handler: async ( request, reply ) => {

      const ret = await controller.create( request.body );

      return reply.code( 201 ).send( ret );
    }
  });
  }

  if( routes.includes( 'update' ) && controller.update ){
  server.patch( `${basePath}/:id`, {
    schema: {
      params: { $ref: `${entityName}Id` },
      body: { $ref: `${entityName}Update` },
      response: {
        200: { $ref: `${entityName}` },
        404: { $ref: `NotFound` },
        400: { $ref: `BadRequest` },
      },
      summary: `Update ${entityName} by ID`,
      },
      handler: async ( request, reply ) => {
        const ret = await controller.update( request.params.id, request.body );

      return reply.code( 200 ).send( ret );
      }
  });
  }

  if( routes.includes( 'delete' ) && controller.remove ){
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
      const ret = await controller.remove( request.params.id );

      return reply.code( 200 ).send( ret );
    }
  });
};
}

export default crudRoutes;
