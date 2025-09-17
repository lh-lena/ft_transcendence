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
  >(): FastifyPluginAsync<crudDefines.CrudRoutesOptions<TEntity, TQuery, TCreate, TUpdate, TId>> =>
  async (server: FastifyInstance, options) => {
    const {
      basePath,
      entityName,
      controller,
      routes = ['getQuery', 'getById', 'create', 'update', 'delete'],
    } = options;

    if (routes.includes('getQuery') && controller.getQuery) {
      server.get(basePath, {
        schema: {
          summary: 'Get all or query for atributes',
          description: `Endpoint to get either all ${entityName} or query for atributes. Query with ?atribute=value`,
          tags: [`${entityName}`],
          querystring: { $ref: `${entityName}Query` },
          response: {
            200: { $ref: `${entityName}ResponseArray` },
            404: { $ref: `NotFound` },
          },
        },
        handler: async (
          request: FastifyRequest<crudDefines.GetAll<TQuery>>,
          reply: FastifyReply,
        ) => {
          const query = request.query as TQuery;
          const ret = await controller.getQuery!(query);

          return reply.code(200).send(ret);
        },
      });
    }

    if (routes.includes('getById') && controller.getById) {
      server.get(`${basePath}/:${entityName}Id`, {
        schema: {
          summary: `get one ${entityName}`,
          description: `Endpoint to get one ${entityName} by its Id`,
          tags: [`${entityName}`],
          params: { $ref: `${entityName}Id` },
          response: {
            200: { $ref: `${entityName}Response` },
            404: { $ref: `NotFound` },
          },
        },
        handler: async (request: FastifyRequest<crudDefines.GetById<TId>>, reply: FastifyReply) => {
          const id = request.params as TId;
          const ret = await controller.getById!(id);

          return reply.code(200).send(ret);
        },
      });
    }

    if (routes.includes('create') && controller.create) {
      server.post(basePath, {
        schema: {
          summary: `create a new ${entityName}`,
          description: `Endpoint to create a new ${entityName}`,
          tags: [`${entityName}`],
          body: { $ref: `${entityName}Create` },
          response: {
            201: { $ref: `${entityName}Response` },
            400: { $ref: `BadRequest` },
          },
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
      server.patch(`${basePath}/:${entityName}Id`, {
        schema: {
          summary: `update atributes of ${entityName}`,
          description: `Endpoint to update one or more atributes of ${entityName}`,
          tags: [`${entityName}`],
          params: { $ref: `${entityName}Id` },
          body: { $ref: `${entityName}Update` },
          response: {
            200: { $ref: `${entityName}Response` },
            404: { $ref: `NotFound` },
            400: { $ref: `BadRequest` },
          },
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
      server.delete(`${basePath}/:${entityName}Id`, {
        schema: {
          summary: `delete one ${entityName}`,
          description: `Endpoint to delete one ${entityName} via its Id`,
          tags: [`${entityName}`],
          params: { $ref: `${entityName}Id` },
          response: {
            200: { success: true },
            404: { $ref: `NotFound` },
          },
        },
        handler: async (request: FastifyRequest<crudDefines.Delete<TId>>, reply: FastifyReply) => {
          const id = request.params as TId;
          const ret = await controller.deleteOne!(id);

          return reply.code(200).send(ret);
        },
      });
    }
  };

export default crudRoutes;
