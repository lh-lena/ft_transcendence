import { FastifyInstance } from 'fastify';
import { FastifyRequest, FastifyReply } from 'fastify';
import { FastifyPluginAsync } from 'fastify';
import * as crudDefines from './crudDefines';

const crudRoutes =
  <
    TEntity = unknown,
    TQuery = unknown,
    TCreate = unknown,
    TUpdate = unknown,
    TId = unknown,
  >(): FastifyPluginAsync<
    crudDefines.CrudRoutesOptions<TEntity, TQuery, TCreate, TUpdate, TId>
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
          request: FastifyRequest<crudDefines.GetAll<TQuery>>,
          reply: FastifyReply,
        ) => {
          const query = request.query as TQuery;
          const ret = await controller.getAllorFiltered!(query);

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
          request: FastifyRequest<crudDefines.GetById<TId>>,
          reply: FastifyReply,
        ) => {
          const id = request.params as TId;
          const ret = await controller.getById!(id);

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
          request: FastifyRequest<crudDefines.Create<TCreate>>,
          reply: FastifyReply,
        ) => {
          const body = request.body as TCreate;
          const ret = await controller.create!(body);

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
          request: FastifyRequest<crudDefines.Update<TId, TUpdate>>,
          reply: FastifyReply,
        ) => {
          const id = request.params as TId;
          const body = request.body as TUpdate;
          const ret = await controller.update!(id, body);

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
          request: FastifyRequest<crudDefines.Delete<TId>>,
          reply: FastifyReply,
        ) => {
          const id = request.params as TId;
          const ret = await controller.deleteOne!(id);

          return reply.code(200).send(ret);
        },
      });
    }
  };

export default crudRoutes;
