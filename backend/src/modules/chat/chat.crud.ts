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

  getOverview: async (userId: string): Promise<ChatMessage[]> => {
    const lastMessages = await prisma.$queryRaw<
      {
        id: number;
        senderId: string;
        reciverId: string;
        message: string;
        createdAt: Date;
      }[]
    >`
  SELECT
    m.id,
    m.senderId,
    m.reciverId,
    m.message,
    m.createdAt
  FROM ChatMessage m
  INNER JOIN (
    SELECT
      CASE
        WHEN senderId = ${userId} THEN reciverId
        ELSE senderId
      END AS chatPartner,
      MAX(createdAt) AS maxCreatedAt
    FROM ChatMessage
    WHERE senderId = ${userId} OR reciverId = ${userId}
    GROUP BY chatPartner
  ) lm
  ON
    ((m.senderId = ${userId} AND m.reciverId = lm.chatPartner) OR (m.reciverId = ${userId} AND m.senderId = lm.chatPartner))
    AND m.createdAt = lm.maxCreatedAt
  ORDER BY m.createdAt DESC
`;

    return lastMessages;
  },
};
