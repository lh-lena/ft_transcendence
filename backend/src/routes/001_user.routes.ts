import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';
import { userController } from '../modules/user/user.controller';
import type {
  userType,
  userQueryType,
  userCreateType,
  userUpdateType,
} from '../schemas/user';

const userRoutes = async (server: FastifyInstance) => {
  server.register(
    crudRoutes<
      userType,
      userQueryType,
      userCreateType,
      userUpdateType,
      number
    >(),
    {
      basePath: '/api/user',
      entityName: 'user',
      controller: userController,
      routes: ['getQuery', 'getById', 'create', 'update', 'delete'],
    },
  );
};

export default fp(userRoutes);
