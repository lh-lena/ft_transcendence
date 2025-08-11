import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';
import { userController } from '../modules/user/user.controller';
import {
  userType,
  userQueryInput,
  userCreateInput,
  userUpdateInput,
  userIdInput,
} from '../schemas/user';

const userRoutes = async (server: FastifyInstance) => {
  server.register(
    crudRoutes<
      userType,
      userQueryInput,
      userCreateInput,
      userUpdateInput,
      userIdInput
    >(),
    {
      basePath: '/api/user',
      entityName: 'user',
      controller: userController,
      routes: ['getAll', 'getById', 'create', 'update', 'delete'],
    },
  );
};

export default fp(userRoutes);
