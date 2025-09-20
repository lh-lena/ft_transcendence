import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AxiosRequestConfig } from 'axios';
import { hashPassword } from '../auth/passwords';

import { apiClientBackend } from '../utils/apiClient';
import type {
  UserType,
  UserIdType,
  UserQueryType,
  UserPatchType,
  UserUpdateType,
} from '../schemas/user';
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

  fastify.get('/api/user/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    console.log(
      '\n[DEBUG] GET /api/user/:id called with params:',
      req.params,
      'and user:',
      req.user,
    );
    const parsedReq = userIdSchema.safeParse(req.params);

    if (!parsedReq.success) {
      return reply.code(400).send({ error: 'Invalid user ID' });
    }

    const requestId: UserIdType = parsedReq.data;

    const config: AxiosRequestConfig = {
      method: 'get',
      url: `/user/${requestId.userId}`,
      //headers: req.headers,
    };

    const user: UserType = await apiClientBackend(config);

    const isSelf = requestId.userId === req.user.id;
    const schema = isSelf ? userResponseSchema : userInfoResponseSchema;

    const ret = schema.safeParse(user);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse user data' });
    }
    const userRet = ret.data;

    return reply.code(200).send(userRet);
  });

  fastify.get('/api/user', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = userQuerySchema.safeParse(req.query);

    if (!parsedReq.success) {
      return reply.code(400).send({ error: 'Invalid query parameters' });
    }

    const userQuery: UserQueryType = parsedReq.data;

    const method = req.method.toLowerCase();
    const url = `/user`;

    const config: AxiosRequestConfig = {
      method,
      url,
      headers: req.headers,
      params: userQuery,
    };

    const users: UserType[] = await apiClientBackend(config);

    const ret = userInfoResponseArraySchema.safeParse(users);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse user data' });
    }

    const usersRet = ret.data;
    return reply.code(200).send(usersRet);
  });

  fastify.patch('/api/user/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
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

    let password_hash: string | undefined;

    if (updateData.password) {
      password_hash = await hashPassword(updateData.password);
    }
    const updateUser: UserUpdateType = updateData;

    if (password_hash) updateUser.password_hash = password_hash;

    const config: AxiosRequestConfig = {
      method: 'patch',
      url: `/user/${requestId.userId}`,
      data: updateUser,
    };

    const updatedUser: UserType = await apiClientBackend(config);

    const ret = userResponseSchema.safeParse(updatedUser);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse user data' });
    }

    const userRet = ret.data;
    return reply.code(201).send(userRet);
  });

  fastify.delete('/api/user/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = userIdSchema.safeParse(req.params);

    if (!parsedReq.success) {
      return reply.code(400).send({ error: 'Invalid user Id' });
    }

    const requestId: UserIdType = parsedReq.data;

    if (requestId.userId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden: You can only delete your own profile' });
    }

    const config: AxiosRequestConfig = {
      method: 'delete',
      url: `/user/${requestId.userId}`,
    };

    const ret = await apiClientBackend(config);

    return reply.code(200).send({ message: 'User deleted successfully', ret });
  });
};

export default fp(backendUserRoutes);
