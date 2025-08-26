import { Prisma } from '@prisma/client';
import type { chatCreateType } from '../../schemas/chat';

export async function transformInput(data: chatCreateType): Promise<Prisma.ChatMessageCreateInput> {
  return {
    message: data.message,
    sender: { connect: { id: data.senderId } },
    reciver: { connect: { id: data.reciverId } },
  };
}
