import { Prisma, ChatMessage } from '@prisma/client';
import { chatModel } from './chat.crud';
import { chatCreateType } from '../../schemas/chat';

import { NotFoundError, BlockedError } from '../../utils/error';

import { blockedService } from '../blocked/blocked.service';
import { transformInput } from './chat.helper';

export const chatService = {
  async create(data: chatCreateType): Promise<ChatMessage> {
    if (await blockedService.isBlocked(data.senderId, data.recieverId)) {
      throw new BlockedError('You are blocked');
    }
    const prismaData = await transformInput(data);
    try {
      const ret = await chatModel.insert(prismaData);
      return ret;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new NotFoundError('chat already exists');
      }
      throw err;
    }
  },

  async getQuery(query?: Prisma.ChatMessageWhereInput): Promise<ChatMessage[]> {
    const ret = query ? await chatModel.findBy(query) : await chatModel.findAll();

    return ret;
  },

  async getOverview(userId: string): Promise<ChatMessage[]> {
    const ret = await chatModel.getOverview(userId);

    return ret;
  },
};
