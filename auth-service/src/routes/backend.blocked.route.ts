import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { apiClientBackend } from '../utils/apiClient';
import { AxiosRequestConfig } from 'axios';

import { userIdSchema } from '../schemas/user';

import { blockedQuerySchema, blockedResponseSchema } from '../schemas/blocked';

const backendFriendsRoute = async (fastify: FastifyInstance) => {
  //-----------------Friend Routes-----------------
  fastify.all('/blocked/*', async (req: FastifyRequest, reply: FastifyReply) => {
    let parsedReq;

    if (req.params) {
      parsedReq = userIdSchema.safeParse(req.params);
    } else if (req.query) {
      parsedReq = blockedQuerySchema.safeParse(req.query);
    }

    if (!parsedReq || !parsedReq.success) {
      return reply.status(400).send({ error: 'Invalid input parameters' });
    }

    if (parsedReq.data.userId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const method = req.method.toLowerCase();
    const url = req.url.replace('/^/blocked/', '');

    const config: AxiosRequestConfig = {
      method,
      url,
      headers: req.headers,
    };

    if (method === 'get' || method === 'delete') {
      config.params = req.query;
    } else if (method === 'post') {
      config.data = req.body;
    }

    const resp = await apiClientBackend(config);

    const ret = blockedResponseSchema.safeParse(resp);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse Friend Data' });
    }

    const blockedRet = ret.data;

    return reply.code(resp.status).send(blockedRet);
  });
};

export default fp(backendFriendsRoute);
