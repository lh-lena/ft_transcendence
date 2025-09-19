import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { apiClientBackend } from '../utils/apiClient';
import { AxiosRequestConfig } from 'axios';

import { userIdSchema } from '../schemas/user';

import { friendQuerySchema, friendPostSchema, friendResponseSchema } from '../schemas/friend';

const backendFriendsRoute = async (fastify: FastifyInstance) => {
  //-----------------Friend Routes-----------------
  fastify.get('/api/friend', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = friendQuerySchema.safeParse(req.query);

    if (!parsedReq || !parsedReq.success) {
      return reply.status(400).send({ error: 'Invalid input parameters' });
    }

    if (parsedReq.data.userId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const config: AxiosRequestConfig = {
      method: 'get',
      url: '/friend',
      params: parsedReq.data,
    };

    const resp = await apiClientBackend(config);

    const ret = friendResponseSchema.safeParse(resp);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse Friend Data' });
    }

    const friendRet = ret.data;

    return reply.code(200).send(friendRet);
  });

  fastify.post('/api/friend', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = friendPostSchema.safeParse(req.body);

    if (!parsedReq || !parsedReq.success) {
      return reply.status(400).send({ error: 'Invalid input parameters' });
    }

    if (parsedReq.data.userId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const config: AxiosRequestConfig = {
      method: 'get',
      url: '/friend',
      data: parsedReq.data,
    };

    const resp = await apiClientBackend(config);

    const ret = friendResponseSchema.safeParse(resp);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse Friend Data' });
    }

    const friendRet = ret.data;

    return reply.code(200).send(friendRet);
  });

  fastify.delete('/api/friend', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = userIdSchema.safeParse(req.params);

    if (!parsedReq || !parsedReq.success) {
      return reply.status(400).send({ error: 'Invalid input parameters' });
    }

    if (parsedReq.data.userId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const config: AxiosRequestConfig = {
      method: 'delete',
      url: `/friend/${parsedReq.data.userId}`,
    };

    const resp = await apiClientBackend(config);

    const ret = friendResponseSchema.safeParse(resp);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse Friend Data' });
    }

    const friendRet = ret.data;

    return reply.code(200).send(friendRet);
  });
};

export default fp(backendFriendsRoute);
