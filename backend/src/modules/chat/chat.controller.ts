import { Prisma } from '@prisma/client';
import type { chatType, chatCreateType } from '../../schemas/chat';
import { chatBase } from '../../schemas/chat';

import { chatService } from './chat.service';

export const chatController = {
  async create(data: chatCreateType): Promise<chatType> {
    const ret = await chatService.create(data);
    return chatBase.parse(ret);
  },

  async getQuery(query?: Prisma.ChatMessageWhereInput): Promise<chatType[]> {
    const ret = await chatService.getQuery(query);
    return ret.map((ret) => chatBase.parse(ret));
  },
};
