import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { apiClientBackend } from '../utils/apiClient';
import { AxiosRequestConfig } from 'axios';

import { userIdSchema } from '../schemas/user';

import { blockedQuerySchema, blockedPostSchema, blockedResponseSchema } from '../schemas/blocked';

const backendFriendsRoute = async (fastify: FastifyInstance) => {
  //-----------------Friend Routes-----------------
  fastify.get('/api/blocked', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = blockedQuerySchema.safeParse(req.query);

    if (!parsedReq || !parsedReq.success) {
      return reply.status(400).send({ error: 'Invalid input parameters' });
    }

    if (parsedReq.data.userId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const config: AxiosRequestConfig = {
      method: 'get',
      url: '/blocked',
      params: parsedReq.data,
    };

    const resp = await apiClientBackend(config);

    const ret = blockedResponseSchema.safeParse(resp);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse Friend Data' });
    }

    const blockedRet = ret.data;

    return reply.code(200).send(blockedRet);
  });

  fastify.post('/api/blocked', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = blockedPostSchema.safeParse(req.body);

    if (!parsedReq || !parsedReq.success) {
      return reply.status(400).send({ error: 'Invalid input parameters' });
    }

    if (parsedReq.data.userId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const config: AxiosRequestConfig = {
      method: 'post',
      url: '/blocked',
      data: parsedReq.data,
    };

    const resp = await apiClientBackend(config);

    const ret = blockedResponseSchema.safeParse(resp);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse Friend Data' });
    }

    const blockedRet = ret.data;

    return reply.code(200).send(blockedRet);
  });

  fastify.delete('/api/blocked/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = userIdSchema.safeParse(req.params);

    if (!parsedReq || !parsedReq.success) {
      return reply.status(400).send({ error: 'Invalid input parameters' });
    }

    if (parsedReq.data.userId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const config: AxiosRequestConfig = {
      method: 'delete',
      url: `/blocked/${parsedReq.data.userId}`,
    };

    const resp = await apiClientBackend(config);

    const ret = blockedResponseSchema.safeParse(resp);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse Friend Data' });
    }

    const blockedRet = ret.data;

    return reply.code(200).send(blockedRet);
  });
};

export default fp(backendFriendsRoute);
