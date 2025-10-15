import { userIdSchema } from '../schemas/user';
import type { UserIdType } from '../schemas/user';

import { resultQuerySchema, resultResponseArraySchema } from '../schemas/result';

import type { ResultQueryType } from '../schemas/result';

export const resultRoutesConfig = {
  getLeaderboard: {
    method: 'get' as const,
    url: `/result/leaderboard`,
    successCode: 200,
  },

  getStats: {
    method: 'get' as const,
    url: (params: UserIdType) => `/result/stats/${params.userId}`,
    paramsSchema: userIdSchema,
    successCode: 200,
    errorMessages: {
      invalidParams: 'Invalid user ID',
    },
  },

  getResult: {
    method: 'get' as const,
    url: `/result`,
    querySchema: resultQuerySchema,
    responseSchema: resultResponseArraySchema,
    checkOwnership: async (data: { query?: ResultQueryType }, userId: string) => {
      return data.query?.winnerId !== userId && data.query?.loserId !== userId;
    },
    successCode: 200,
    errorMessages: {
      invalidQuery: 'Invalid query parameters',
      forbidden: 'Forbidde: You can only access your own results',
    },
  },
};
