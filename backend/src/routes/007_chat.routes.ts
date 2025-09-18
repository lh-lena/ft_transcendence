import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';

import { chatController } from '../modules/chat/chat.controller';
import type { chatType, chatQueryType, chatCreateType } from '../schemas/chat';
import type { userIdType } from '../schemas/user';

const chatRoutes = async (server: FastifyInstance) => {
  server.register(crudRoutes<chatType, chatQueryType, chatCreateType, null, null>(), {
    basePath: '/api/chat',
    entityName: 'chat',
    controller: chatController,
    routes: ['getQuery', 'create'],
  });

  server.get('/api/chat/overview/:userId', {
    schema: {
      summary: 'Get chat overview by ID',
      description: 'Endpoint to retrieve the users chats, including last message and participants.',
      tags: ['chat'],
      params: { $ref: 'userId' },
      response: {
        200: { $ref: 'chatResponseArray' },
      },
    },
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const params = req.params as userIdType;
      const ret = await chatController.getOverview(params.userId);

      return reply.code(200).send(ret);
    },
  });
};

export default fp(chatRoutes);
