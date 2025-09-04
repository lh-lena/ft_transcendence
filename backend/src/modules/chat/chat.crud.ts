import { prisma } from '../../plugins/001_prisma';
import { Prisma, ChatMessage } from '@prisma/client';

export const chatModel = {
  findAll: async (): Promise<ChatMessage[]> => {
    return await prisma.chatMessage.findMany();
  },

  findBy: async (where: Prisma.ChatMessageWhereInput): Promise<ChatMessage[]> => {
    return await prisma.chatMessage.findMany({ where });
  },

  insert: async (data: Prisma.ChatMessageCreateInput): Promise<ChatMessage> => {
    return await prisma.chatMessage.create({ data });
  },
};
