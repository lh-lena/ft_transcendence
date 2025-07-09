import { FastifyInstance } from 'fastify';
import { FastifyPluginAsync } from 'fastify';

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

  const schemaRef = server.getSchemas();

  server.get( basePath, {
    schema: {
      querystring: schemaRef[ `${entityName}Query` ],
      response: {
        200: schemaRef[ `${entityName}ResponseArray` ],
      },
      summary: `Get all or filtered ${basePath}`,
    },
    handler: async ( request, reply ) => {
      const context = contextFactory( server );
     await controller.getAllorFiltered( context, request.query );
    }
  });

  server.get( `${basePath}/:id`, {
    schema: {
      params: schemaRef[ `${entityName}Id` ],
      response: {
      200: schemaRef[ `${entityName}Response` ],
      404: schemaRef[ `NotFound` ],
      },
      summary: `Get ${entityName} by ID`,
    },
    handler: async ( request, reply ) => {
      const context = contextFactory( server );
      await controller.getById( context, request.params.id );
    }
  });

  server.post( basePath, {
    schema: {
      body: schemaRef[ `${entityName}Create` ],
      response: {
        201: schemaRef[ `${entityName}Response` ],
        400: schemaRef[ `BadRequest` ],
      },
      summary: `Create a new ${entityName}`,
    },
    handler: async ( request, reply ) => {
      const context = contextFactory( server );
      await controller.create( context, request.body );
    }
  });

  server.patch( `${basePath}/:id`, {
    schema: {
      params: schemaRef[ `${entityName}Id` ],
      body: schemaRef[ `${entityName}Update` ],
      response: {
        200: schemaRef[ `${entityName}Response` ],
        404: schemaRef[ `NotFound` ],
        400: schemaRef[ `BadRequest` ],
      },
      summary: `Update ${entityName} by ID`,
      },
      handler: async ( request, reply ) => {
        const context = contextFactory( server );
        await controller.update( context, request.params.id, request.body );
      }
  });

  server.delete( `${basePath}/:id`, {
    schema: {
      params: schemaRef[ `${entityName}id` ],
      response: {
      200: schemaRef[ `${entityName}Delete` ],
      404: schemaRef[ `NotFound` ],
      },
      summary: `Delete ${entityName} by ID`,
    },
    handler: async ( request, reply ) => {
      const context = contextFactory( server );
      await controller.remove( context, request.params.id );
    }
  });
};

export default crudRoutes;
