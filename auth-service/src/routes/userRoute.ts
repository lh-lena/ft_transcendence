import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { handleRoute } from '../utils/routeHandler';
import { userRoutes } from '../config/userRouteConfig';
import { AxiosRequestConfig } from 'axios';

import {
  userIdSchema,
  guestSchema,
  userResponseSchema,
  userInfoResponseSchema,
} from '../schemas/user';

const backendUserRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/api/user', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, userRoutes.getUsers, fastify);
  });

  fastify.patch('/api/user/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, userRoutes.updateUser, fastify);
  });

  fastify.delete('/api/user/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    return handleRoute(req, reply, userRoutes.deleteUser, fastify);
  });

  fastify.get('/api/user/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = userIdSchema.safeParse(req.params);

    if (!parsedReq.success) {
      return reply.code(400).send({ message: 'Invalid user ID' });
    }

    const requestId = parsedReq.data;

    const config: AxiosRequestConfig = {
      method: 'get',
      url: `/user/${requestId.userId}`,
    };

    const user = await fastify.api(config);

    let schema;
    if (user.guest) schema = guestSchema;
    else {
      const isSelf = requestId.userId === req.user.id;
      schema = isSelf ? userResponseSchema : userInfoResponseSchema;
    }

    const ret = schema.safeParse(user);

    if (!ret.success) {
      return reply.code(500).send({ message: 'Failed to parse user data' });
    }

    return reply.code(200).send(ret.data);
  });
};

export default fp(backendUserRoutes);
