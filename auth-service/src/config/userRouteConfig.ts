import { hashPassword } from '../utils/passwords';
import {
  userIdSchema,
  userQuerySchema,
  userPatchSchema,
  userResponseSchema,
  userInfoResponseSchema,
  userInfoResponseArraySchema,
  guestSchema,
} from '../schemas/user';

import type { UserIdType, UserPatchType, UserUpdateType } from '../schemas/user';

/**
 * User Route Configuration
 * Manages user profiles, updates, and account operations
 * Handles both authenticated users and guest accounts
 */
export const userRoutesConfig = {
  /**
   * Get User Profile
   * Retrieves user information with appropriate visibility
   * @param userId - User ID to retrieve
   * @returns Full profile if own user, limited info if other user, guest schema if guest
   *
   * Response varies based on:
   * - Own profile: Full user data
   * - Other user: Public info only (username, avatar, stats)
   * - Guest: Minimal guest data
   */
  getUser: {
    method: 'get' as const,
    url: (params: UserIdType) => `/user/${params.userId}`,
    paramsSchema: userIdSchema,
    selectResponseSchema: (response: unknown, data: { params?: UserIdType }, userId: string) => {
      const isGuest =
        response &&
        typeof response === 'object' &&
        'guest' in response &&
        (response as Record<string, unknown>).guest === true;

      if (isGuest) {
        return guestSchema;
      }

      const isSelf = data.params?.userId === userId;
      return isSelf ? userResponseSchema : userInfoResponseSchema;
    },
    errorMessages: {
      invalidParams: 'Invalid user ID',
      parseError: 'Failed to parse user data',
    },
  },

  /**
   * Search/List Users
   * Queries users with filters (username, online status, etc.)
   * @param query - Search filters
   * @returns Array of user info (public data only)
   */
  getUsers: {
    method: 'get' as const,
    url: '/user',
    querySchema: userQuerySchema,
    responseSchema: userInfoResponseArraySchema,
    errorMessages: {
      invalidQuery: 'Invalid query Parameters',
      forbidden: 'Forbidden: You can only update your own profile',
    },
  },

  /**
   * Update User Profile
   * Modifies user account information
   * @requires Authentication & Ownership
   * @param userId - Must match authenticated user ID
   * @param body - Fields to update (username,  password, avatar, etc.)
   * @returns 200 - Updated user profile
   *
   * Security notes:
   * - Password is automatically hashed before storage
   * - Cannot modify userId or createdAt
   */
  updateUser: {
    method: 'patch' as const,
    url: (params: UserIdType) => `/user/${params.userId}`,
    paramsSchema: userIdSchema,
    bodySchema: userPatchSchema,
    responseSchema: userResponseSchema,
    checkOwnership: async (data: { params?: UserIdType }, userId: string) => {
      return data.params?.userId === userId;
    },
    transformRequest: async (data: UserPatchType) => {
      const { password, ...rest } = data;
      const updateData: UserUpdateType = { ...rest };

      if (password) updateData.password_hash = await hashPassword(password);

      return updateData;
    },
    successCode: 200,
    errorMessages: {
      invalidParams: 'Invalid user ID',
      invalidBody: 'Invalid update Data',
      forbidden: 'Forbidden: You can only update your own profile',
      apiError: 'username already taken',
    },
  },

  /**
   * Delete User Account
   * Permanently removes user account and associated data
   * @requires Authentication & Ownership
   * @param userId - Must match authenticated user ID
   * @returns 204 - Account deleted successfully
   *
   * Warning: This action is irreversible and will:
   * - Delete all user data
   * - Remove from friend lists
   * - Invalidate all sessions
   * - Delete game history
   */
  deleteUser: {
    method: 'delete' as const,
    url: (params: UserIdType) => `/user/${params.userId}`,
    paramsSchema: userIdSchema,
    checkOwnership: async (data: { params?: UserIdType }, userId: string) => {
      return data.params?.userId === userId;
    },
    successCode: 204,
    errorMessages: {
      invalidParams: 'Invalid user Id',
      forbidden: 'Forbidden: You can only delete your own profile',
    },
  },
};
