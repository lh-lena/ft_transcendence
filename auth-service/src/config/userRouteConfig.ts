import { hashPassword } from '../auth/passwords';
import {
  userIdSchema,
  userQuerySchema,
  userPatchSchema,
  userResponseSchema,
  userInfoResponseSchema,
  userInfoResponseArraySchema,
  guestSchema,
} from '../schemas/user';

//Configs for userRoutes
export const userRoutes = {
  //get user by id
  getUsers: {
    method: 'get' as const,
    url: '/user',
    querySchema: userQuerySchema,
    responseSchema: userInfoResponseArraySchema,
  },

  updateUser: {
    method: 'patch' as const,
    url: (params: any) => `/user/${params.userId}`,
    paramsSchema: userIdSchema,
    bodySchema: userPatchSchema,
    responseSchema: userResponseSchema,
    checkOwnership: (data: any, userId: string) => data.userId === userId,
    transformRequest: async (data: any) => {
      if (data.password) {
        const password_hash = await hashPassword(data.password);
        return { ...data, password_hash, password: undefined };
      }
      return data;
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
    url: (params: any) => `/user/${params.userId}`,
    paramsSchema: userIdSchema,
    checkOwnership: (data: any, userId: string) => data.userId === userId,
    transformResponse: (data: any) => ({
      message: 'User deleted successfully',
      ret: data,
    }),
    errorMessages: {
      invalidParams: 'Invalid user Id',
      forbidden: 'Forbidden: You can only delete your own profile',
    },
  },
};
