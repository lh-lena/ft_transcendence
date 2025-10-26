import { userIdSchema } from '../schemas/user';
import type { UserIdType } from '../schemas/user';

import { resultQuerySchema, resultResponseArraySchema } from '../schemas/result';

import type { ResultQueryType } from '../schemas/result';

/**
 * Game Result Route Configuration
 * Manages game results, statistics, and leaderboards
 */
export const resultRoutesConfig = {
  /**
   * Get Leaderboard
   * Retrieves top players ranked by wins, rating, or other metrics
   * @public No authentication required
   * @returns Array of top players with stats
   */
  getLeaderboard: {
    method: 'get' as const,
    url: `/result/leaderboard`,
    successCode: 200,
  },

  /**
   * Get User Statistics
   * Retrieves game statistics for a specific user
   * @param userId - User to get stats for
   * @returns User statistics (wins, losses)
   */
  getStats: {
    method: 'get' as const,
    url: (params: UserIdType) => `/result/stats/${params.userId}`,
    paramsSchema: userIdSchema,
    successCode: 200,
    errorMessages: {
      invalidParams: 'Invalid user ID',
    },
  },

  /**
   * Get Game Results by userId
   * Retrieves results for games the user participated in
   * @requires Authentication
   * @param param.userId
   * @returns Array of game results
   */
  getResultById: {
    method: 'get' as const,
    url: (params: UserIdType) => `/result/${params.userId}`,
    paramsSchema: userIdSchema,
    responseSchema: resultResponseArraySchema,
    checkOwnership: async (data: { params?: UserIdType }, userId: string) => {
      return data.params?.userId === userId;
    },
    successCode: 200,
    errorMessages: {
      invalidParams: 'Invalid userId',
      forbidden: 'Forbidde: You can only access your own results',
    },
  },

  /**
   * Get Game Results
   * Retrieves results for games the user participated in
   * @requires Authentication
   * @param query.winnerId - Filter by winner (optional)
   * @param query.loserId - Filter by loser (optional)
   * @returns Array of game results
   */
  getResult: {
    method: 'get' as const,
    url: `/result`,
    querySchema: resultQuerySchema,
    responseSchema: resultResponseArraySchema,
    checkOwnership: async (data: { query?: ResultQueryType }, userId: string) => {
      return data.query?.winnerId === userId || data.query?.loserId === userId;
    },
    successCode: 200,
    errorMessages: {
      invalidQuery: 'Invalid query parameters',
      forbidden: 'Forbidde: You can only access your own results',
    },
  },
};
