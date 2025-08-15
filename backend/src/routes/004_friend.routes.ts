import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';

import { friendController } from '../modules/friend/friend.controller';
import type {
  friendType,
  friendIdType,
  friendQueryType,
  friendCreateType,
} from '../schemas/friend';

const friendRoutes = async (server: FastifyInstance) => {
  server.register(
    crudRoutes<
      friendType,
      friendQueryType,
      friendCreateType,
      friendIdType,
      number
    >(),
    {
      basePath: '/api/friend',
      entityName: 'friend',
      controller: friendController,
      routes: ['getQuery', 'create', 'delete'],
    },
  );
};

export default fp(friendRoutes);
