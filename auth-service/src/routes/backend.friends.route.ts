import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { apiClientBackend } from '../utils/apiClient';
import { AxiosRequestConfig } from 'axios';

import { userIdSchema } from '../schemas/user';

import { friendQuerySchema, friendPostSchema, friendResponseSchema } from '../schemas/friend';

const backendFriendsRoute = async (fastify: FastifyInstance) => {
  //-----------------Friend Routes-----------------
  fastify.all('/api/friend', async (req: FastifyRequest, reply: FastifyReply) => {
    let parsedReq;
    let parsedBody;

    if (req.query) {
      parsedReq = friendQuerySchema.safeParse(req.query);
    } else if (req.params) {
      parsedReq = userIdSchema.safeParse(req.params);
    }

    if (req.body) {
      console.log(req.body);
      parsedBody = friendPostSchema.safeParse(req.body);
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
      url: '/friend',
      headers: req.headers,
    };

    if (method === 'get' || method === 'delete') {
      config.params = req.query;
    } else if (method === 'post') {
      config.data = req.body;
    }

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
