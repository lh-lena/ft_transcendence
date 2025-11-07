import { FastifyInstance } from 'fastify';
import * as User from '../schemas/user';
import { AxiosRequestConfig } from 'axios';

/**
 * User Actions Utilities
 *
 * Provides methods for user-related operations that communicate
 * with the backend service API. All methods include error handling
 * and logging for debugging.
 *
 * Available operations:
 * - Create new user
 * - Get user by ID
 * - Search for user by criteria
 * - Search for multiple users
 * - Update user profile
 *
 * @param server - Fastify server instance with API client
 * @returns user Object/s
 */
export const userActions = (server: FastifyInstance) => ({
  /**
   * Create a new user
   *
   * @param newUser - User data for creation
   * @returns Promise<User.UserType> - Created user object with generated ID
   * @throws {Error} If user creation fails
   *
   * @example
   * const user = await fastify.user.post({
   *   username: 'john_doe',
   *   passwordHash: hashedPassword,
   * });
   */
  async post(newUser: User.UserType): Promise<User.UserType> {
    const config: AxiosRequestConfig = {
      method: 'POST',
      url: '/user',
      data: newUser,
    };

    server.log.info(
      {
        username: newUser.username,
      },
      'Creating new user',
    );

    const user: User.UserType = await server.api(config);

    server.log.info(
      {
        userId: user.userId,
        username: user.username,
      },
      'User created successfully',
    );

    return user;
  },

  /**
   * Get user by ID
   *
   * @param userId - User's unique identifier (UUID)
   * @returns Promise<User.UserType> - User object
   * @throws {Error} If user not found or request fails
   *
   * @example
   * const user = await fastify.user.getById('123e4567-e89b-12d3-a456-426614174000');
   */
  async getById(userId: string): Promise<User.UserType> {
    const config: AxiosRequestConfig = {
      method: 'GET',
      url: `/user/${userId}`,
    };

    server.log.debug({ userId }, 'Fetching user by ID');

    const user: User.UserType = await server.api(config);

    return user;
  },

  /**
   * Get single user by search criteria
   *
   * Searches for a user matching the provided criteria.
   * Returns the first matching user or null if none found.
   *
   * @param params - Search criteria (e.g., { username: 'john' })
   * @returns Promise<User.UserType | null> - First matching user or null
   * @throws {Error} If request fails
   *
   * @example
   * const user = await fastify.user.getUser({ username: 'john_doe' });
   * if (!user) {
   *   return reply.status(404).send({ message: 'User not found' });
   * }
   */
  async getUser(params: Record<string, unknown>): Promise<User.UserType | null> {
    try {
      const config: AxiosRequestConfig = {
        method: 'GET',
        url: '/user',
        params,
      };

      server.log.debug({ params }, 'Searching for user');

      const users: User.UserType[] = await server.api(config);

      if (users.length === 0) {
        server.log.debug({ params }, 'No user found matching criteria');
        return null;
      }

      if (users.length > 1) {
        server.log.warn(
          {
            params,
            count: users.length,
          },
          'Multiple users found, returning first',
        );
      }

      return users[0];
    } catch (error) {
      server.log.error({ params, error }, 'Failed to search for user');

      throw new Error('Failed to search for user');
    }
  },

  /**
   * Get multiple users by search criteria
   *
   * Searches for all users matching the provided criteria.
   * Supports filtering, pagination, etc.
   *
   * @param params - Search criteria and options
   * @returns Promise<User.UserType[]> - Array of matching users (empty if none)
   * @throws {Error} If request fails
   *
   * @example
   * // Get all users with specific role
   * const admins = await fastify.user.getUsersArr({ role: 'admin' });
   *
   * @example
   * // Get paginated users
   * const users = await fastify.user.getUsersArr({
   *   page: 1,
   *   limit: 20,
   *   sortBy: 'createdAt'
   * });
   */
  async getUsersArr(params: Record<string, unknown>): Promise<User.UserType[]> {
    try {
      const config: AxiosRequestConfig = {
        method: 'GET',
        url: '/user',
        params,
      };

      server.log.debug({ params }, 'Fetching multiple users');

      const users: User.UserType[] = await server.api(config);

      server.log.debug(
        {
          params,
          count: users.length,
        },
        'Users fetched successfully',
      );

      return users;
    } catch (error) {
      server.log.error({ params, error }, 'Failed to fetch users');

      throw new Error('Failed to fetch users');
    }
  },

  /**
   * Update user profile
   *
   * Patches user record with provided data.
   * Only updates fields present in the update object.
   *
   * @param userId - User ID to update
   * @param updates - Partial user object with fields to update
   * @returns Promise<User.UserType> - Updated user object
   * @throws {Error} If update fails or user not found
   *
   * @example
   * const updatedUser = await fastify.user.patch(userId, {
   *   tfaEnabled: true,
   * });
   */
  async patch(userId: string, updates: Partial<User.UserType>): Promise<User.UserType> {
    try {
      const config: AxiosRequestConfig = {
        method: 'PATCH',
        url: `/user/${userId}`,
        data: updates,
      };

      server.log.info(
        {
          userId,
          updateFields: Object.keys(updates),
        },
        'Updating user',
      );

      const updatedUser: User.UserType = await server.api(config);

      server.log.info(
        {
          userId,
          updateFields: Object.keys(updates),
        },
        'User updated successfully',
      );

      return updatedUser;
    } catch (error) {
      server.log.error(
        {
          userId,
          updateFields: Object.keys(updates),
          error,
        },
        'Failed to update user',
      );

      throw new Error(`Failed to update user: ${userId}`);
    }
  },
});
