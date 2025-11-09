/**
 * User Routes
 *
 * Provides CRUD operations and additional endpoints for user management.
 *
 * @module routes/user
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import crudRoutes from '../../utils/crudRoutes';

import type { userQueryType, userCreateType, userUpdateType, userIdType } from '../../schemas/user';

/**
 * User Routes Plugin
 *
 * @param server - Fastify server instance
 */
const userRoutes = async (server: FastifyInstance) => {
  server.register(crudRoutes<userQueryType, userCreateType, userUpdateType, userIdType>(), {
    basePath: '/',
    entityName: 'user',
    routes: ['getQuery', 'getById', 'create', 'update', 'delete'],
  });

  /**
   * Get User Count
   */
  server.get('/count', {
    schema: {
      summary: 'Get user count',
      description: 'Total number of registered users',
      tags: ['user'],
      response: {
        200: { $ref: 'userCount' },
        500: { $ref: 'InternalError' },
      },
    },
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      const count = await server.services.user.getCount();
      return reply.code(200).send({ count });
    },
  });
};

export default userRoutes;
