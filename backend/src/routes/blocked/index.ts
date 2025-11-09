/**
 * Blocked Users Routes
 *
 * Provides endpoints for managing blocked user relationships.
 *
 * Endpoints:
 * - GET /api/blocked - Get all blocked relationships or query by attributes
 * - POST /api/blocked - Block a user
 * - DELETE /api/blocked/:blockedId - Unblock a user
 *
 * @module routes/blocked
 */

import { FastifyInstance } from 'fastify';

import crudRoutes from '../../utils/crudRoutes';

import type { blockedIdType, blockedQueryType, blockedCreateType } from '../../schemas/blocked';

/**
 * Blocked Users Routes Plugin
 *
 * Registers all blocked user management routes.
 * Service is created with server instance for dependency injection.
 *
 * @param server - Fastify server instance
 */
const blockedRoutes = async (server: FastifyInstance) => {
  server.register(crudRoutes<blockedQueryType, blockedCreateType, null, blockedIdType>(), {
    basePath: '/',
    entityName: 'blocked',
    routes: ['getQuery', 'create', 'delete'],
  });
};

export default blockedRoutes;
