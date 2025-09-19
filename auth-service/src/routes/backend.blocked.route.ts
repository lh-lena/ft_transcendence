import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { apiClientBackend } from '../utils/apiClient';
import { AxiosRequestConfig } from 'axios';

import { userIdSchema } from '../schemas/user';

import { blockedQuerySchema, blockedPostSchema, blockedResponseSchema } from '../schemas/blocked';

const backendFriendsRoute = async (fastify: FastifyInstance) => {
  //-----------------Friend Routes-----------------
  fastify.all('/api/blocked', async (req: FastifyRequest, reply: FastifyReply) => {
    let parsedReq;
    let parsedBody;

    if (req.query) {
      parsedReq = blockedQuerySchema.safeParse(req.query);
    } else if (req.params) {
      parsedReq = userIdSchema.safeParse(req.params);
    }

    if (req.body) {
      parsedBody = blockedPostSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return reply.status(400).send({ error: 'Invalid input parameters' });
      }
    }

    if (!parsedReq || !parsedReq.success) {
      return reply.status(400).send({ error: 'Invalid input parameters' });
    }

    if (parsedReq.data.userId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const method = req.method.toLowerCase();

    const config: AxiosRequestConfig = {
      method,
      url: '/blocked',
      headers: req.headers,
    };

    if (method === 'get' || method === 'delete') {
      config.params = req.user.id;
    } else if (method === 'post') {
      config.data = req.body;
    }

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
