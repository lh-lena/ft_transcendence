import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { AxiosRequestConfig } from 'axios';
import { apiClientBackend } from '../utils/apiClient';

import { userIdSchema } from '../schemas/user';
import type { UserIdType } from '../schemas/user';

import { resultQuerySchema, resultResponseArraySchema } from '../schemas/result';
import type {
  ResultQueryType,
  ResultResponseType,
  ResultResponseArrayType,
  ResultStatsResponseType,
  LeaderboardType,
} from '../schemas/result';

const backendResultRoutes = async (fastify: FastifyInstance) => {
  //-------Result Routes-------//
  fastify.get('/api/result/leaderboard', async (_, reply: FastifyReply) => {
    const config: AxiosRequestConfig = {
      method: `get`,
      url: '/result/leaderboard',
    };

    const results: LeaderboardType[] = await apiClientBackend(config);
    return reply.code(200).send(results);
  });

  fastify.get('/api/result/stats/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = userIdSchema.safeParse(req.params);

    if (!parsedReq.success) {
      return reply.code(400).send({ message: 'Invalid user Id' });
    }

    const userId: UserIdType = parsedReq.data;

    const config: AxiosRequestConfig = {
      method: 'get',
      url: `/result/stats/${userId.userId}`,
    };

    const results: ResultStatsResponseType[] = await apiClientBackend(config);

    console.log(results);

    return reply.code(200).send(results);
  });

  fastify.get('/api/result', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = resultQuerySchema.safeParse(req.query);

    if (!parsedReq.success) {
      return reply.code(400).send({ message: 'Invalid query parameters' });
    }

    const resultQuery: ResultQueryType = parsedReq.data;

    if (resultQuery.winnerId !== req.user.id && resultQuery.loserId !== req.user.id) {
      return reply.code(403).send({ message: 'Forbidden: You can only access your own results' });
    }

    const config: AxiosRequestConfig = {
      method: 'get',
      url: '/result',
      params: resultQuery,
    };

    const results: ResultResponseType[] = await apiClientBackend(config);

    const ret = resultResponseArraySchema.safeParse(results);

    if (!ret.success) {
      return reply.code(500).send({ message: 'Failed to parse result data' });
    }

    const resultRet: ResultResponseArrayType = ret.data;

    return reply.code(200).send(resultRet);
  });
};

export default fp(backendResultRoutes);
