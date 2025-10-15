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

//Configs for userRoutes
export const userRoutesConfig = {
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

      // Check if requesting own profile
      const isSelf = data.params?.userId === userId;
      return isSelf ? userResponseSchema : userInfoResponseSchema;
    },
    errorMessages: {
      invalidParams: 'Invalid user ID',
      parseError: 'Failed to parse user data',
    },
  },

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
    successCode: 201,
    errorMessages: {
      invalidParams: 'Invalid user ID',
      invalidBody: 'Invalid update Data',
      forbidden: 'Forbidden: You can only update your own profile',
    },
  },

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
