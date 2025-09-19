import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { AxiosRequestConfig } from 'axios';
import { apiClientBackend } from '../utils/apiClient';

import {
  chatQuerySchema,
  chatPostSchema,
  chatResponseSchema,
  chatResponseArraySchema,
} from '../schemas/chat';
import type {
  ChatType,
  ChatQueryType,
  ChatPostType,
  ChatResponseType,
  ChatResponseArrayType,
} from '../schemas/chat';

import { userIdSchema } from '../schemas/user';
import type { UserIdType } from '../schemas/user';

const backendChatRoutes = async (fastify: FastifyInstance) => {
  //-------Chat Routes-------//

  fastify.get('/api/chat/overview/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = userIdSchema.safeParse(req.params);
    console.log(req.params, ' in chat route');

    if (!parsedReq.success) {
      return reply.code(400).send({ error: 'Invalid user Id' });
    }

    const userId: UserIdType = parsedReq.data;

    if (userId.userId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden: You can only access your own chats' });
    }

    const method = req.method.toLowerCase();
    const url = '/chat/overview/' + userId.userId;

    const config: AxiosRequestConfig = {
      method,
      url,
      headers: req.headers,
      params: userId,
    };

    const chats: ChatType[] = await apiClientBackend(config);

    const ret = chatResponseArraySchema.safeParse(chats);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse chat data' });
    }

    const chatRet: ChatResponseArrayType = ret.data;

    return reply.code(200).send(chatRet);
  });

  fastify.get('/api/chat/*', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = chatQuerySchema.safeParse(req.query);

    if (!parsedReq.success) {
      return reply.code(400).send({ error: 'Invalid query parameters' });
    }

    const chatQuery: ChatQueryType = parsedReq.data;

    if (chatQuery.senderId !== req.user.id && chatQuery.reciverId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden: You can only access your own chats' });
    }

    const method = req.method.toLowerCase();
    const url = req.url.replace('/^/chat/', '/chat/');

    const config: AxiosRequestConfig = {
      method,
      url,
      headers: req.headers,
      params: chatQuery,
    };

    const chats: ChatType[] = await apiClientBackend(config);

    const ret = chatResponseArraySchema.safeParse(chats);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse chat data' });
    }

    const chatRet: ChatResponseArrayType = ret.data;

    return reply.code(200).send(chatRet);
  });

  fastify.post('/api/chat', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = chatPostSchema.safeParse(req.body);

    if (!parsedReq.success) {
      return reply.code(400).send({ error: 'Invalid Chat Message' });
    }

    const chatMessage: ChatPostType = parsedReq.data;

    if (chatMessage.senderId !== req.user.id && chatMessage.reciverId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const method = req.method.toLowerCase();
    const url = '/chat';

    const config: AxiosRequestConfig = {
      method,
      url,
      headers: req.headers,
      data: chatMessage,
    };
    const postedChat: ChatType = await apiClientBackend(config);

    const ret = chatResponseSchema.safeParse(postedChat);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse chat data' });
    }

    const chatRet: ChatResponseType = ret.data;
    return reply.code(201).send(chatRet);
  });
};

export default fp(backendChatRoutes);
