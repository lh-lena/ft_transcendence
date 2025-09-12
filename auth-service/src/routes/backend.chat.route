import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { apiClientBackend } from '../utils/apiClient';

import type { ChatType, ChatIdType, ChatQueryType, ChatPatchType } from '../schemas/chat';
import {
  chatIdSchema,
  chatQuerySchema,
  chatPatchSchema,
  chatResponseSchema,
  chatInfoResponseSchema,
  chatInfoResponseArraySchema,
} from '../schemas/chat';

const backendChatRoutes = async (fastify: FastifyInstance) => {
  //-------Chat Routes-------//

  fastify.get('/chat/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = chatIdSchema.safeParse(req.params);

    if (!parsedReq.success) {
      return reply.code(400).send({ error: 'Invalid chat ID' });
    }

    const requestId: ChatIdType = parsedReq.data;

    const chat: ChatType = await apiClientBackend.get(`/chat/${requestId.chatId}`);

    const isSelf = requestId.chatId === req.chat.id;
    const schema = isSelf ? chatResponseSchema : chatInfoResponseSchema;

    const ret = schema.safeParse(chat);
    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse chat data' });
    }
    const chatRet = ret.data;

    return reply.code(200).send(chatRet);
  });

  fastify.get('/chat', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = chatQuerySchema.safeParse(req.query);

    if (!parsedReq.success) {
      return reply.code(400).send({ error: 'Invalid query parameters' });
    }

    const chatQuery: ChatQueryType = parsedReq.data;

    const chats: ChatType[] = await apiClientBackend.get('/chat', { params: chatQuery });

    const schema = chatInfoResponseArraySchema;

    const ret = schema.safeParse(chats);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse chat data' });
    }

    const chatsRet = ret.data;
    return reply.code(200).send(chatsRet);
  });

  fastify.patch('/chat/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedParams = chatIdSchema.safeParse(req.params);
    const parsedBody = chatPatchSchema.safeParse(req.body);

    if (!parsedParams.success) {
      return reply.code(400).send({ error: 'Invalid chat ID' });
    }

    if (!parsedBody.success) {
      return reply.code(400).send({ error: 'Invalid update Data' });
    }

    const requestId: ChatIdType = parsedParams.data;
    const updateData: ChatPatchType = parsedBody.data;

    if (requestId.chatId !== req.chat.id) {
      return reply.code(403).send({ error: 'Forbidden: You can only update your own profile' });
    }

    const updatedChat: ChatType = await apiClientBackend.patch(
      `/chat/${requestId.chatId}`,
      updateData,
    );

    const ret = chatResponseSchema.safeParse(updatedChat);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse chat data' });
    }

    const chatRet = ret.data;
    return reply.code(201).send(chatRet);
  });
};

export default fp(backendChatRoutes);
