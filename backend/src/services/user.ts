/**
 * User Service
 *
 * Handles business logic for user management.
 *
 * Features:
 * - User CRUD operations
 * - Avatar management
 * - Guest user handling
 * - Query operations
 *
 * @module modules/user/service
 */

import { promises as fs } from 'fs';
import path from 'path';

import { Prisma, User } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import type { userType, userIdType, userInfoType } from '../schemas/user';
import { NotFoundError } from '../utils/error';

/**
 * Transform Prisma User (with Date) to API User (with string dates)
 */
function transformUser(user: User): userType {
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    tfaCodeExpires: user.tfaCodeExpires ? user.tfaCodeExpires.toISOString() : null,
  };
}

/**
 * Create user service instance with Prisma access
 *
 * @param server - Fastify instance with Prisma client
 */
export const createUserService = (server: FastifyInstance) => ({
  /**
   * Create user
   *
   * @param data - User creation data
   * @returns Created user
   * @throws ConflictError if user already exists
   */
  async create(data: Prisma.UserCreateInput): Promise<userType> {
    const user = await server.prisma.user.create({ data });

    server.log.info({ userId: user.userId }, 'User created successfully');

    return transformUser(user);
  },

  /**
   * Update user
   *
   * Handles avatar cleanup when new avatar is uploaded.
   * Manages guest user lifecycle.
   *
   * @param id - User ID
   * @param data - Update data
   * @returns Updated user
   * @throws NotFoundError if user doesn't exist
   */
  async update(userId: userIdType, data: Prisma.UserUpdateInput): Promise<userType> {
    if (data.avatar) {
      await this.deleteAvatar(userId);
    }

    const user = await server.prisma.user.update({
      where: userId,
      data,
    });

    server.log.info({ userId }, 'User updated successfully');

    return transformUser(user);
  },

  /**
   * Query users
   *
   * Automatically filters out guest users unless explicitly requested.
   *
   * @param query - Optional Prisma where clause
   * @returns Array of users
   */
  async getQuery(query?: Prisma.UserWhereInput): Promise<userType[]> {
    const where = query ? { ...query, guest: false } : { guest: false };

    const users = await server.prisma.user.findMany({ where });
    return users.map(transformUser);
  },

  /**
   * Get user by ID
   *
   * @param id - User ID
   * @returns User record
   * @throws NotFoundError if user doesn't exist
   */
  async getById(userId: Prisma.UserWhereUniqueInput): Promise<userType> {
    const user = await server.prisma.user.findUnique({
      where: { ...userId },
    });

    server.log.debug({ ...userId }, 'Fetching user by ID');

    if (!user) {
      throw new NotFoundError('User with ID ${id} not found');
    }

    return transformUser(user);
  },

  /**
   * Get user info by ID
   *
   * Returns subset of user data for public display.
   *
   * @param id - User ID
   * @returns User info
   */
  async getInfoById(userId: Prisma.UserWhereUniqueInput): Promise<userInfoType> {
    const user = await this.getById(userId);
    return user as userInfoType;
  },

  /**
   * Delete user
   *
   * Cleans up avatar before deletion.
   *
   * @param id - User ID
   * @throws NotFoundError if user doesn't exist
   */
  async deleteOne(userId: userIdType): Promise<void> {
    await this.deleteAvatar(userId);

    await server.prisma.user.delete({
      where: { ...userId },
    });

    server.log.info({ ...userId }, 'User deleted successfully');
  },

  /**
   * Get total user count
   *
   * Excludes guest users from count.
   *
   * @returns Total number of non-guest users
   */
  async getCount(): Promise<number> {
    return await server.prisma.user.count({
      where: { guest: false },
    });
  },

  /**
   * Delete user's avatar file
   *
   * Silently fails if avatar doesn't exist or deletion fails.
   * Uses async fs operations to avoid blocking.
   *
   * @param id - User ID
   */
  async deleteAvatar(userId: userIdType): Promise<void> {
    try {
      const avatarDir = server.config.AVATAR_DIR;

      const user = await server.prisma.user.findUnique({
        where: userId,
        select: { avatar: true },
      });

      if (!user?.avatar) return;

      const avatarPath = path.join(avatarDir, user.avatar);

      await fs.access(avatarPath);
      await fs.unlink(avatarPath);

      server.log.info({ userId, avatarPath }, 'Avatar deleted successfully');
    } catch (error) {
      server.log.warn({ userId, error }, 'Failed to delete avatar');
    }
  },
});

export type UserService = ReturnType<typeof createUserService>;
