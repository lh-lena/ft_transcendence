import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { apiClientBackend } from '../utils/apiClient';
import { AxiosRequestConfig } from 'axios';

import {
  blockedIdSchema,
  blockedQuerySchema,
  blockedPostSchema,
  blockedResponseSchema,
} from '../schemas/blocked';

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
    console.log('Blocked Post Request', req.body);
    const parsedReq = blockedPostSchema.safeParse(req.body);
    console.log('Parsed Request', parsedReq);

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

  fastify.delete('/api/blocked/:blockedId', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = blockedIdSchema.safeParse(req.params);

    if (!parsedReq || !parsedReq.success) {
      return reply.status(400).send({ error: 'Invalid input parameters' });
    }

    let config: AxiosRequestConfig = {
      method: 'get',
      url: '/blocked',
      params: parsedReq.data,
    };

    const blockedCheck = await apiClientBackend(config);

    if (blockedCheck.length !== 1 || blockedCheck[0].userId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    config = {
      method: 'delete',
      url: `/blocked/${parsedReq.data.blockedId}`,
    };

    const resp = await apiClientBackend(config);

    return reply.code(200).send(resp);
  });
};

export default fp(backendFriendsRoute);
