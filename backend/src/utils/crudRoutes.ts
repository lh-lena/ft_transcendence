/**
 * Generic CRUD Routes Generator
 *
 * Provides a reusable pattern for generating standard CRUD endpoints.
 * Reduces boilerplate by automatically creating common route handlers.
 *
 * Supported Operations:
 * - getQuery: GET /resource - Get all or filter by query params
 * - getById: GET /resource/:id - Get single resource by ID
 * - create: POST /resource - Create new resource
 * - update: PATCH /resource/:id - Update existing resource
 * - delete: DELETE /resource/:id - Delete resource
 *
 * Features:
 * - Type-safe with TypeScript generics
 * - Automatic OpenAPI schema generation
 * - Consistent error handling
 * - Flexible route selection
 *
 * @module utils/crudRoutes
 */

import { FastifyInstance } from 'fastify';
import { FastifyRequest, FastifyReply } from 'fastify';
import { FastifyPluginAsync } from 'fastify';
import * as crudDefines from './crudDefines';

// Define a generic service interface with optional methods
interface CrudService<
  TQuery = unknown,
  TCreate = unknown,
  TUpdate = unknown,
  TId = unknown,
  TEntity = unknown,
> {
  getQuery?: (query: TQuery) => Promise<TEntity[]>;
  getById?: (id: TId) => Promise<TEntity>;
  create?: (data: TCreate) => Promise<TEntity>;
  update?: (id: TId, data: TUpdate) => Promise<TEntity>;
  deleteOne?: (id: TId) => Promise<{ success: boolean }>;
}

function isValidServiceKey(
  services: FastifyInstance['services'],
  key: string,
): key is keyof FastifyInstance['services'] {
  return key in services;
}

/**
 * Get service with type safety and runtime validation
 */
function getServiceSafely(server: FastifyInstance, entityName: string): CrudService {
  if (!isValidServiceKey(server.services, entityName)) {
    throw new Error(
      `Service '${entityName}' not found in server.services. ` +
        `Available services: ${Object.keys(server.services).join(', ')}`,
    );
  }
  return server.services[entityName] as CrudService;
}

/**
 * Type guard to check if service has a specific method
 */
function hasMethod<K extends keyof CrudService>(
  service: CrudService,
  method: K,
): service is Required<Pick<CrudService, K>> & CrudService {
  return typeof service[method] === 'function';
}

/**
 * CRUD Routes Generator
 *
 * Creates a Fastify plugin that registers standard CRUD routes
 * based on provided configuration.
 *
 * @template TEntity - Entity type returned by operations
 * @template TQuery - Query parameters type for filtering
 * @template TCreate - Request body type for creation
 * @template TUpdate - Request body type for updates
 * @template TId - ID parameter type
 *
 * @returns FastifyPluginAsync configured with CRUD routes
 *
 * @example
 * server.register(
 *   crudRoutes<User, UserQuery, UserCreate, UserUpdate, UserId>(),
 *   {
 *     basePath: '/api/users',
 *     entityName: 'user',
 *     routes: ['getQuery', 'getById', 'create', 'update', 'delete']
 *   }
 * );
 */
const crudRoutes =
  <
    TQuery = unknown,
    TCreate = unknown,
    TUpdate = unknown,
    TId = unknown,
  >(): FastifyPluginAsync<crudDefines.CrudRoutesOptions> =>
  async (server: FastifyInstance, options) => {
    const {
      basePath,
      entityName,
      routes = ['getQuery', 'getById', 'create', 'update', 'delete'],
    } = options;

    const service = getServiceSafely(server, entityName);

    if (!service) {
      throw new Error(
        `No service found for entity '${entityName}'. ` +
          `Either provide a service or ensure server.services.${entityName} exists.`,
      );
    }

    /**
     * GET by ID Route
     *
     * Retrieves a single resource by its unique identifier.
     * Example: GET /api/users/123
     */
    if (routes.includes('getById') && hasMethod(service, 'getById')) {
      server.get(basePath + `:${entityName}Id`, {
        schema: {
          summary: `Get one ${entityName}`,
          description: `Endpoint to get one ${entityName} by its ID`,
          tags: [entityName],
          params: { $ref: `${entityName}Id` },
          response: {
            200: { $ref: `${entityName}Response` },
            404: { $ref: 'NotFound' },
            500: { $ref: 'InternalError' },
          },
        },
        handler: async (request: FastifyRequest<crudDefines.GetById<TId>>, reply: FastifyReply) => {
          const id = request.params as TId;
          const result = await service.getById(id);

          return reply.code(200).send(result);
        },
      });
    }

    /**
     * GET Query Route
     *
     * Retrieves all resources or filters by query parameters.
     * Example: GET /api/users?status=active&role=admin
     */
    if (routes.includes('getQuery') && hasMethod(service, 'getQuery')) {
      server.get(basePath, {
        schema: {
          summary: `Get all ${entityName}s or query by attributes`,
          description: `Endpoint to get either all ${entityName}s or query by attributes. Query with ?attribute=value`,
          tags: [entityName],
          querystring: { $ref: `${entityName}Query` },
          response: {
            200: { $ref: `${entityName}ResponseArray` },
            404: { $ref: 'NotFound' },
            500: { $ref: 'InternalError' },
          },
        },
        handler: async (
          request: FastifyRequest<crudDefines.GetAll<TQuery>>,
          reply: FastifyReply,
        ) => {
          const query = request.query as TQuery;
          const result = await service.getQuery(query);

          return reply.code(200).send(result);
        },
      });
    }

    /**
     * POST Create Route
     *
     * Creates a new resource.
     * Example: POST /api/users with body { name: "John", password_hash: "..." }
     */
    if (routes.includes('create') && hasMethod(service, 'create')) {
      server.post(basePath, {
        schema: {
          summary: `Create a new ${entityName}`,
          description: `Endpoint to create a new ${entityName}`,
          tags: [entityName],
          body: { $ref: `${entityName}Create` },
          response: {
            201: { $ref: `${entityName}Response` },
            400: { $ref: 'BadRequest' },
            500: { $ref: 'InternalError' },
          },
        },
        handler: async (
          request: FastifyRequest<crudDefines.Create<TCreate>>,
          reply: FastifyReply,
        ) => {
          const body = request.body as TCreate;
          const result = await service.create(body);

          return reply.code(201).send(result);
        },
      });
    }

    /**
     * PATCH Update Route
     *
     * Updates one or more attributes of an existing resource.
     * Example: PATCH /api/users/123 with body { name: "Jane" }
     */
    if (routes.includes('update') && hasMethod(service, 'update')) {
      server.patch(basePath + `:${entityName}Id`, {
        schema: {
          summary: `Update attributes of ${entityName}`,
          description: `Endpoint to update one or more attributes of ${entityName}`,
          tags: [entityName],
          params: { $ref: `${entityName}Id` },
          body: { $ref: `${entityName}Update` },
          response: {
            200: { $ref: `${entityName}Response` },
            404: { $ref: 'NotFound' },
            400: { $ref: 'BadRequest' },
            500: { $ref: 'InternalError' },
          },
        },
        handler: async (
          request: FastifyRequest<crudDefines.Update<TId, TUpdate>>,
          reply: FastifyReply,
        ) => {
          const id = request.params as TId;
          const body = request.body as TUpdate;
          const result = await service.update(id, body);

          return reply.code(200).send(result);
        },
      });
    }

    /**
     * DELETE Route
     *
     * Deletes a resource by its unique identifier.
     * Example: DELETE /api/users/123
     */
    if (routes.includes('delete') && hasMethod(service, 'deleteOne')) {
      server.delete(basePath + `:${entityName}Id`, {
        schema: {
          summary: `Delete one ${entityName}`,
          description: `Endpoint to delete one ${entityName} via its ID`,
          tags: [entityName],
          params: { $ref: `${entityName}Id` },
          response: {
            200: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
              },
            },
            404: { $ref: 'NotFound' },
            500: { $ref: 'InternalError' },
          },
        },
        handler: async (request: FastifyRequest<crudDefines.Delete<TId>>, reply: FastifyReply) => {
          const id = request.params as TId;
          const result = await service.deleteOne(id);

          return reply.code(200).send(result);
        },
      });
    }
  };

export default crudRoutes;
