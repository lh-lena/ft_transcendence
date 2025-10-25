/**
 * Chat Service
 *
 * Handles business logic for chat messages.
 *
 * Features:
 * - Message creation with block checking
 * - Bidirectional message queries
 * - Chat overview with last messages
 *
 * @module modules/chat/service
 */

import { Prisma, ChatMessage } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { BlockedError } from '../utils/error';
import { BlockedService } from './blocked';

import type { chatCreateType, chatType } from '../schemas/chat';
import type { userIdType } from '../schemas/user';

/**
 * Transform ChatMessage Date to string
 */
function transformChatMessage(message: ChatMessage): chatType {
  return {
    ...message,
    createdAt: message.createdAt.toISOString(),
  };
}

/**
 * Create chat service instance with Prisma access
 *
 * @param server - Fastify instance with Prisma client
 */
export const createChatService = (server: FastifyInstance, blockedService: BlockedService) => {
  return {
    /**
     * Create chat message
     *
     * Validates that sender is not blocked before creating message.
     *
     * @param data - Message data
     * @returns Created message
     * @throws BlockedError if sender is blocked by receiver
     */
    async create(data: chatCreateType): Promise<chatType> {
      const { senderId, recieverId } = data;
      if (await blockedService.isBlocked({ userId: senderId }, { userId: recieverId })) {
        throw new BlockedError('Cannot send message: you are blocked by this user');
      }

      const message = await server.prisma.chatMessage.create({
        data: {
          message: data.message,
          sender: { connect: { userId: senderId } },
          reciever: { connect: { userId: recieverId } },
        },
      });

      server.log.info({ senderId: senderId, receiverId: recieverId }, 'Chat message created');

      return transformChatMessage(message);
    },

    /**
     * Query chat messages
     *
     * Supports bidirectional queries: messages between two users
     * regardless of who is sender/receiver.
     *
     * @param query - Optional Prisma where clause
     * @returns Array of messages
     */
    async getQuery(query?: Prisma.ChatMessageWhereInput): Promise<chatType[]> {
      if (query?.senderId && query?.recieverId) {
        const messages = await server.prisma.chatMessage.findMany({
          where: {
            OR: [
              { senderId: query.senderId, recieverId: query.recieverId },
              { senderId: query.recieverId, recieverId: query.senderId },
            ],
          },
          orderBy: { createdAt: 'asc' },
        });
        return messages.map(transformChatMessage);
      }

      const messages = await server.prisma.chatMessage.findMany({
        where: query,
        orderBy: { createdAt: 'asc' },
      });
      return messages.map(transformChatMessage);
    },

    /**
     * Get chat overview for user
     *
     * Returns last message from each conversation the user is in.
     * Useful for displaying chat list in UI.
     *
     * @param userId - User ID
     * @returns Array of last messages per conversation
     */
    async getOverview(userId: userIdType): Promise<chatType[]> {
      const lastMessages = await server.prisma.$queryRaw<ChatMessage[]>`
        SELECT
          m.id,
          m.senderId,
          m.recieverId,
          m.message,
          m.createdAt
        FROM ChatMessage m
        INNER JOIN (
          SELECT
            CASE
              WHEN senderId = ${userId} THEN recieverId
              ELSE senderId
            END AS chatPartner,
            MAX(createdAt) AS maxCreatedAt
          FROM ChatMessage
          WHERE senderId = ${userId} OR recieverId = ${userId}
          GROUP BY chatPartner
        ) lm
        ON
          ((m.senderId = ${userId.userId} AND m.recieverId = lm.chatPartner) 
           OR (m.recieverId = ${userId.userId} AND m.senderId = lm.chatPartner))
          AND m.createdAt = lm.maxCreatedAt
        ORDER BY m.createdAt DESC
      `;

      return lastMessages.map(transformChatMessage);
    },
  };
};

export type ChatService = ReturnType<typeof createChatService>;
