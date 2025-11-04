/**
 * Blocked Users Service
 *
 * Handles business logic for blocking/unblocking users.
 *
 * Features:
 * - Block user relationships
 * - Check if user is blocked
 * - Prevent duplicate blocks
 * - Bidirectional block checking
 *
 * @module modules/blocked/service
 */

import { Prisma, Blocked } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import type { blockedCreateType, blockedIdType } from '../schemas/blocked';
import type { userIdType } from '../schemas/user';

/**
 * Create blocked service instance with Prisma access
 *
 * Uses dependency injection pattern for testability
 *
 * @param server - Fastify instance with Prisma client
 */
export const createBlockedService = (server: FastifyInstance) => ({
  /**
   * Block a user
   *
   * Prevents duplicate blocks by checking existing relationship first.
   * Creates Prisma relation between user and blocked user.
   *
   * @param data - User IDs for block relationship
   * @returns Created or existing block record
   */
  async create(data: blockedCreateType): Promise<Blocked> {
    const existing = await server.prisma.blocked.findFirst({
      where: {
        userId: data.userId,
        blockedUserId: data.blockedUserId,
      },
    });

    if (existing) {
      return existing;
    }

    const blocked = await server.prisma.blocked.create({
      data: {
        user: { connect: { userId: data.userId } },
        blocked: { connect: { userId: data.blockedUserId } },
      },
    });

    server.log.info(
      { userId: data.userId, blockedUserId: data.blockedUserId },
      'User blocked successfully',
    );

    return blocked;
  },

  /**
   * Query blocked relationships
   *
   * @param query - Optional Prisma where clause
   * @returns Array of blocked relationships
   */
  async getQuery(query?: Prisma.BlockedWhereInput): Promise<Blocked[]> {
    return await server.prisma.blocked.findMany({
      where: query,
    });
  },

  /**
   * Unblock a user
   *
   * @param id - Blocked relationship ID
   * @throws NotFoundError if relationship doesn't exist
   */
  async deleteOne(id: blockedIdType): Promise<void> {
    await server.prisma.blocked.delete({ where: id });

    server.log.info({ blockedId: id }, 'User unblocked successfully');
  },

  /**
   * Check if user is blocked
   *
   * Useful for chat and interaction validation.
   *
   * @param userId - User ID initiating action
   * @param blockedUserId - Target user ID
   * @returns true if blocked, false otherwise
   */
  async isBlocked(userId: userIdType, blockedUserId: userIdType): Promise<boolean> {
    const blocked = await server.prisma.blocked.findFirst({
      where: {
        userId: userId.userId,
        blockedUserId: blockedUserId.userId,
      },
    });

    server.log.info(blocked, `Block check for sender ${blockedUserId}, from user: ${userId}`);
    return Boolean(blocked);
  },
});

export type BlockedService = ReturnType<typeof createBlockedService>;
