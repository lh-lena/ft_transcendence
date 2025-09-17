import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { apiClientBackend } from '../utils/apiClient';

import {
  resultQuerySchema,
  resultPostSchema,
  resultResponseSchema,
  resultResponseArraySchema,
} from '../schemas/result';
import type {
  ResultQueryType,
  ResultPostType,
  ResultResponseType,
  ResultResponseArrayType,
  LeaderboardType,
} from '../schemas/result';

const backendResultRoutes = async (fastify: FastifyInstance) => {
  //-------Result Routes-------//
  fastify.get('/result/leaderboard', async (_, reply: FastifyReply) => {
    const results: LeaderboardType[] = await apiClientBackend.get('/result/leaderboard');
    return reply.code(200).send(results);
  });

  fastify.get('/result/*', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = resultQuerySchema.safeParse(req.query);

    if (!parsedReq.success) {
      return reply.code(400).send({ error: 'Invalid query parameters' });
    }

    const resultQuery: ResultQueryType = parsedReq.data;

    if (resultQuery.winnerId !== req.user.id && resultQuery.loserId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden: You can only access your own results' });
    }

    const results: ResultResponseType[] = await apiClientBackend.get('/result', {
      params: resultQuery,
    });

    const ret = resultResponseArraySchema.safeParse(results);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse result data' });
    }

    const resultRet: ResultResponseArrayType = ret.data;

    return reply.code(200).send(resultRet);
  });

  fastify.post('/result', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = resultPostSchema.safeParse(req.body);

    if (!parsedReq.success) {
      return reply.code(400).send({ error: 'Invalid Result Message' });
    }

    const resultMessage: ResultPostType = parsedReq.data;

    if (resultMessage.winnerId !== req.user.id && resultMessage.loserId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const postedResult: ResultResponseType = await apiClientBackend.post(`/result`, {
      params: resultMessage,
    });

    const ret = resultResponseSchema.safeParse(postedResult);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse result data' });
    }

    const resultRet: ResultResponseType = ret.data;
    return reply.code(201).send(resultRet);
  });
};

export default fp(backendResultRoutes);
