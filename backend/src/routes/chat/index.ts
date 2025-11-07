/**
 * Chat Routes
 *
 * Provides chat message management endpoints.
 *
 * @module routes/chat
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import crudRoutes from '../../utils/crudRoutes';

import type { chatQueryType, chatCreateType } from '../../schemas/chat';
import type { userIdType } from '../../schemas/user';

/**
 * Chat Routes Plugin
 *
 * @param server - Fastify server instance
 */
const chatRoutes = async (server: FastifyInstance) => {
  server.register(crudRoutes<chatQueryType, chatCreateType, null, null>(), {
    basePath: '/',
    entityName: 'chat',
    routes: ['getQuery', 'create'],
  });

  /**
   * Chat Overview Endpoint
   */
  server.get('/overview/:userId', {
    schema: {
      summary: 'Get chat overview by user ID',
      description:
        "Endpoint to retrieve the user's chats, including last message and participants.",
      tags: ['chat'],
      params: { $ref: 'userId' },
      response: {
        200: { $ref: 'chatResponseArray' },
        404: { $ref: 'NotFound' },
        500: { $ref: 'InternalError' },
      },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as userIdType;
      const overview = await server.services.chat.getOverview({ userId: params.userId });

      return reply.code(200).send(overview);
    },
  });
};

export default chatRoutes;
