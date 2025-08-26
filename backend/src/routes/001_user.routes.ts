import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';
import { userController } from '../modules/user/user.controller';
import type { userType, userQueryType, userCreateType, userUpdateType } from '../schemas/user';

const userRoutes = async (server: FastifyInstance) => {
  server.register(crudRoutes<userType, userQueryType, userCreateType, userUpdateType, number>(), {
    basePath: '/api/user',
    entityName: 'user',
    controller: userController,
    routes: ['getQuery', 'getById', 'create', 'update', 'delete'],
  });

  server.get('/api/user/count', {
    schema: {
      response: {
        200: { $ref: 'userCount' },
      },
      summary: 'Get amounts of users',
    },
    handler: async (_, reply: FastifyReply) => {
      const ret = await userController.getCount();

      return reply.code(200).send(ret);
    },
  });

  server.post('/api/user/avatarUpload', {
    schema: {
      summary: 'Upload user avatar',
      consumes: ['multipart/form-data'],
      body: { $ref: 'userAvatarUpload' },
      response: {
        200: { $type: 'string' },
      },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const ret = await userController.uploadAvatar(request);

      return reply.code(200).send(ret);
    },
  });
};

export default fp(userRoutes);
