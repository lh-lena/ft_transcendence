import { FastifyInstance } from 'fastify';
import { FastifyPluginAsync } from 'fastify';

interface CrudRoutesOptions<
  TEntity = unknown,
  TQuery = unknown,
  TCreate = unknown,
  TUpdate = unknown,
> {
  basePath: string;
  entityName: string;
  controller: {
    getAllorFiltered?: (query: TQuery) => Promise<TEntity[]>;
    getById?: (id: number | string) => Promise<TEntity>;
    create?: (body: TCreate) => Promise<TEntity>;
    update?: (id: number | string, body: TUpdate) => Promise<TEntity>;
    deleteOne?: (id: number | string) => Promise<{ success: boolean }>;
  };
  routes?: Array<'getAll' | 'getById' | 'create' | 'update' | 'delete'>;
}

const crudRoutes =
  <
    TEntity = unknown,
    TQuery = unknown,
    TCreate = unknown,
    TUpdate = unknown,
  >(): FastifyPluginAsync<
    CrudRoutesOptions<TEntity, TQuery, TCreate, TUpdate>
  > =>
  async (server: FastifyInstance, options) => {
    const {
      basePath,
      entityName,
      controller,
      routes = ['getAll', 'getById', 'create', 'update', 'delete'],
    } = options;

    if (routes.includes('getAll') && controller.getAllorFiltered) {
      server.get(basePath, {
            schema: {
              querystring: { $ref: `${entityName}Query` },
              response: {
                200: { $ref: `${entityName}ResponseArray` },
                404: { $ref: `NotFound` },
              },
              summary: `Get all or filtered ${entityName}`,
            },
        handler: async (
          request: FastifyRequest<{ QueryString: TQuery }>,
          reply: FastifyReply,
        ) => {
          console.log(request.query);
          const ret = await controller.getAllorFiltered!(request.query);

          //console.log(ret);
          // ret.forEach((ret) => {
          //   console.log(JSON.stringify(ret, null, 3));
          // });

          return reply.code(200).send(ret);
        },
      });
    }

    if (routes.includes('getById') && controller.getById) {
      server.get(`${basePath}/:id`, {
        schema: {
          params: { $ref: `${entityName}Id` },
          response: {
            200: { $ref: `${entityName}Response` },
            404: { $ref: `NotFound` },
          },
          summary: `Get ${entityName} by ID`,
        },
        handler: async (
          request: FastifyRequest<{ Params: { id: string | number } }>,
          reply: FastifyReply,
        ) => {
          const ret = await controller.getById!(request.params.id);

          return reply.code(200).send(ret);
        },
      });
    }

    if (routes.includes('create') && controller.create) {
      server.post(basePath, {
        schema: {
          body: { $ref: `${entityName}Create` },
          response: {
            201: { $ref: `${entityName}Response` },
            400: { $ref: `BadRequest` },
          },
          summary: `Create a new ${entityName}`,
        },
        handler: async (
          request: FastifyRequest<{ Body: TCreate }>,
          reply: FastifyReply,
        ) => {
          const ret = await controller.create!(request.body);

          return reply.code(201).send(ret);
        },
      });
    }

    if (routes.includes('update') && controller.update) {
      server.patch(`${basePath}/:id`, {
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
        handler: async (
          request: FastifyRequest<{
            Params: { id: string | number };
            Body: TUpdate;
          }>,
          reply: FastifyReply,
        ) => {
          const ret = await controller.update!(request.params.id, request.body);

          return reply.code(200).send(ret);
        },
      });
    }

    if (routes.includes('delete') && controller.deleteOne) {
      server.delete(`${basePath}/:id`, {
        schema: {
          params: { $ref: `${entityName}Id` },
          response: {
            200: { $ref: `${entityName}Delete` },
            404: { $ref: `NotFound` },
          },
          summary: `Delete ${entityName} by ID`,
        },
        handler: async (
          request: FastifyRequest<{ Params: { id: string | number } }>,
          reply: FastifyReply,
        ) => {
          const ret = await controller.deleteOne!(request.params.id);

          return reply.code(200).send(ret);
        },
      });
    }
  };

export default crudRoutes;
