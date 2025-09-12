import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { apiClientBackend } from '../utils/apiClient';
import type { UserType, UserIdType, UserQueryType, UserPatchType } from '../schemas/user';
import {
  userIdSchema,
  userQuerySchema,
  userPatchSchema,
  userResponseSchema,
  userInfoResponseSchema,
  userInfoResponseArraySchema,
} from '../schemas/user';

//TODO check if req.user is always used not the provided user
const backendUserRoutes = async (fastify: FastifyInstance) => {
  //-------User Routes-------//

  fastify.get('/user/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = userIdSchema.safeParse(req.params);

    if (!parsedReq.success) {
      return reply.code(400).send({ error: 'Invalid user ID' });
    }

    const requestId: UserIdType = parsedReq.data;

    const user: UserType = await apiClientBackend.get(`/user/${requestId.userId}`);

    const isSelf = requestId.userId === req.user.id;
    const schema = isSelf ? userResponseSchema : userInfoResponseSchema;

    const ret = schema.safeParse(user);
    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse user data' });
    }
    const userRet = ret.data;

    return reply.code(200).send(userRet);
  });

  fastify.get('/user', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = userQuerySchema.safeParse(req.query);

    if (!parsedReq.success) {
      return reply.code(400).send({ error: 'Invalid query parameters' });
    }

    const userQuery: UserQueryType = parsedReq.data;

    const users: UserType[] = await apiClientBackend.get('/user', { params: userQuery });

    const schema = userInfoResponseArraySchema;

    const ret = schema.safeParse(users);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse user data' });
    }

    const usersRet = ret.data;
    return reply.code(200).send(usersRet);
  });

  fastify.patch('/user/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedParams = userIdSchema.safeParse(req.params);
    const parsedBody = userPatchSchema.safeParse(req.body);

    if (!parsedParams.success) {
      return reply.code(400).send({ error: 'Invalid user ID' });
    }

    if (!parsedBody.success) {
      return reply.code(400).send({ error: 'Invalid update Data' });
    }

    const requestId: UserIdType = parsedParams.data;
    const updateData: UserPatchType = parsedBody.data;

    if (requestId.userId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden: You can only update your own profile' });
    }

    const updatedUser: UserType = await apiClientBackend.patch(
      `/user/${requestId.userId}`,
      updateData,
    );

    const ret = userResponseSchema.safeParse(updatedUser);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse user data' });
    }

    const userRet = ret.data;
    return reply.code(201).send(userRet);
  });
};

export default fp(backendUserRoutes);
