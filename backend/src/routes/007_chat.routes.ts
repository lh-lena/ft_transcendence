import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';

import { chatController } from '../modules/chat/chat.controller';
import type { chatType, chatQueryType, chatCreateType } from '../schemas/chat';

const chatRoutes = async (server: FastifyInstance) => {
  server.register(crudRoutes<chatType, chatQueryType, chatCreateType, null, null>(), {
    basePath: '/api/chat',
    entityName: 'chat',
    controller: chatController,
    routes: ['getQuery', 'create'],
  });
};

export default fp(chatRoutes);
