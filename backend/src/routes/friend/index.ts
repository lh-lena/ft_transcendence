/**
 * Friend Routes
 *
 * Provides friend relationship management endpoints.
 *
 * @module routes/friend
 */

import { FastifyInstance } from 'fastify';

import crudRoutes from '../../utils/crudRoutes';

import type { friendIdType, friendQueryType, friendCreateType } from '../../schemas/friend';

/**
 * Friend Routes Plugin
 *
 * @param server - Fastify server instance
 */
const friendRoutes = async (server: FastifyInstance) => {
  server.register(crudRoutes<friendQueryType, friendCreateType, null, friendIdType>(), {
    basePath: '/',
    entityName: 'friend',
    routes: ['getQuery', 'create', 'delete'],
  });
};

export default friendRoutes;
