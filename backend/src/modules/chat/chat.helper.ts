import { Prisma } from '@prisma/client';
import type { chatCreateType } from '../../schemas/chat';

export async function transformInput(data: chatCreateType): Promise<Prisma.ChatMessageCreateInput> {
  return {
    message: data.message,
    sender: { connect: { userId: data.senderId } },
    reciver: { connect: { userId: data.recieverId } },
  };
}
