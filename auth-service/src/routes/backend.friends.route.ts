import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { apiClientBackend } from '../utils/apiClient';
import { AxiosRequestConfig } from 'axios';

import {
  friendIdSchema,
  friendQuerySchema,
  friendPostSchema,
  friendResponseSchema,
} from '../schemas/friend';

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
    console.log(req.body);
    const parsedReq = friendPostSchema.safeParse(req.body);
    console.log(parsedReq);
    if (!parsedReq || !parsedReq.success) {
      return reply.status(400).send({ error: 'Invalid input parameters' });
    }

    if (parsedReq.data.userId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const config: AxiosRequestConfig = {
      method: 'post',
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
    const parsedReq = friendIdSchema.safeParse(req.params);

    if (!parsedReq || !parsedReq.success) {
      return reply.status(400).send({ error: 'Invalid input parameters' });
    }

    let config: AxiosRequestConfig = {
      method: 'get',
      url: `/friend/${parsedReq.data.friendId}`,
    };

    const friendCheck = await apiClientBackend(config);

    if (friendCheck.userId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    config = {
      method: 'delete',
      url: `/friend/${parsedReq.data.friendId}`,
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
