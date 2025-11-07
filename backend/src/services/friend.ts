/**
 * Friend Service
 *
 * Handles business logic for friend relationships.
 *
 * Features:
 * - Bidirectional friendships (automatic reciprocal creation)
 * - Duplicate prevention
 * - Query and delete operations
 *
 * @module modules/friend/service
 */

import { Prisma, Friendship } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import type { friendCreateType, friendIdType } from '../schemas/friend';

/**
 * Create friend service instance with Prisma access
 *
 * @param server - Fastify instance with Prisma client
 */
export const createFriendService = (server: FastifyInstance) => ({
  /**
   * Create friendship
   *
   * Creates bidirectional friendship automatically.
   * If A befriends B, B automatically befriends A.
   *
   * @param data - User IDs for friendship
   * @returns Created friendship record
   */
  async create(data: friendCreateType): Promise<Friendship> {
    const existing = await server.prisma.friendship.findFirst({
      where: {
        userId: data.userId,
        friendUserId: data.friendUserId,
      },
    });

    if (existing) {
      return existing;
    }

    const friendship = await server.prisma.friendship.create({
      data: {
        user: { connect: { userId: data.userId } },
        friend: { connect: { userId: data.friendUserId } },
      },
    });

    this.create({ userId: data.friendUserId, friendUserId: data.userId }).catch((error) => {
      server.log.error(
        { error, userId: data.friendUserId, friendUserId: data.userId },
        'Failed to create reciprocal friendship',
      );
    });

    server.log.info(
      { userId: data.userId, friendUserId: data.friendUserId },
      'Friendship created successfully',
    );

    return friendship;
  },

  /**
   * Query friendships
   *
   * @param query - Optional Prisma where clause
   * @returns Array of friendships
   */
  async getQuery(query?: Prisma.FriendshipWhereInput): Promise<Friendship[]> {
    return await server.prisma.friendship.findMany({
      where: query,
    });
  },

  /**
   * Delete friendship
   *
   * Note: Does not automatically delete reciprocal friendship.
   * Consider implementing bidirectional deletion if needed.
   *
   * @param id - Friendship ID
   * @throws NotFoundError if friendship doesn't exist
   */
  async deleteOne(id: friendIdType): Promise<void> {
    await server.prisma.friendship.delete({ where: id });

    server.log.info({ friendshipId: id }, 'Friendship deleted successfully');
  },
});

export type FriendService = ReturnType<typeof createFriendService>;
