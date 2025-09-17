import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';

import { blockedController } from '../modules/blocked/blocked.controller';
import type {
  blockedType,
  blockedIdType,
  blockedQueryType,
  blockedCreateType,
} from '../schemas/blocked';

const blockedRoutes = async (server: FastifyInstance) => {
  server.register(
    crudRoutes<blockedType, blockedQueryType, blockedCreateType, blockedIdType, blockedIdType>(),
    {
      basePath: '/api/blocked',
      entityName: 'blocked',
      controller: blockedController,
      routes: ['getQuery', 'create', 'delete'],
    },
  );
};

export default fp(blockedRoutes);
