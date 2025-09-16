import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

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

  fastify.get('/chat/overview/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = userIdSchema.safeParse(req.params);

    if (!parsedReq.success) {
      return reply.code(400).send({ error: 'Invalid user Id' });
    }

    const userId: UserIdType = parsedReq.data;

    if (userId.userId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden: You can only access your own chats' });
    }

    const chats: ChatType[] = await apiClientBackend.get('/chat/overview', { params: userId });

    const ret = chatResponseArraySchema.safeParse(chats);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse chat data' });
    }

    const chatRet: ChatResponseArrayType = ret.data;

    return reply.code(200).send(chatRet);
  });

  fastify.get('/chat/*', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = chatQuerySchema.safeParse(req.query);

    if (!parsedReq.success) {
      return reply.code(400).send({ error: 'Invalid query parameters' });
    }

    const chatQuery: ChatQueryType = parsedReq.data;

    if (chatQuery.senderId !== req.user.id && chatQuery.reciverId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden: You can only access your own chats' });
    }

    const chats: ChatType[] = await apiClientBackend.get('/chat', { params: chatQuery });

    const ret = chatResponseArraySchema.safeParse(chats);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse chat data' });
    }

    const chatRet: ChatResponseArrayType = ret.data;

    return reply.code(200).send(chatRet);
  });

  fastify.post('/chat', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = chatPostSchema.safeParse(req.body);

    if (!parsedReq.success) {
      return reply.code(400).send({ error: 'Invalid Chat Message' });
    }

    const chatMessage: ChatPostType = parsedReq.data;

    if (chatMessage.senderId !== req.user.id && chatMessage.reciverId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const postedChat: ChatType = await apiClientBackend.post(`/chat`, { params: chatMessage });

    const ret = chatResponseSchema.safeParse(postedChat);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse chat data' });
    }

    const chatRet: ChatResponseType = ret.data;
    return reply.code(201).send(chatRet);
  });
};

export default fp(backendChatRoutes);
