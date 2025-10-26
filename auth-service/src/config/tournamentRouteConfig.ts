import { userIdSchema } from '../schemas/user';
import type { UserIdType } from '../schemas/user';

import { tournamentIdSchema, tournamentCreateSchema } from '../schemas/tournament';
import type { TournamentIdType } from '../schemas/tournament';

/**
 * Tournament Route Configuration
 * Manages tournament brackets and participation
 * Handles tournament lifecycle from creation to completion
 */
export const tournamentRoutesConfig = {
  /**
   * Get Tournament Details
   * Retrieves tournament information including bracket, participants, and status
   * @param tournamentId - Unique tournament identifier
   * @returns Tournament object with full details
   */
  getTournament: {
    method: 'get' as const,
    url: (params: TournamentIdType) => `/tournament/${params.tournamentId}`,
    paramsSchema: tournamentIdSchema,
    successCode: 200,
    errorMessages: {
      invalidParams: 'Invalid tournament ID',
    },
  },

  /**
   * joins Tournament
   * Joins a new tournament bracket
   * @requires Authentication
   * @param body - Tournament configuration (name, format, max players, etc.)
   * @returns 201 - Tournament created successfully
   */
  joinTournament: {
    method: 'post' as const,
    url: `/tournament`,
    bodySchema: tournamentCreateSchema,
    successCode: 201,
    errorMessages: {
      invalidBody: 'Invalid tournament creation data',
    },
  },

  /**
   * Leave Tournament
   * Removes user from tournament participation
   * @requires Authentication & Ownership
   * @param userId - Must match authenticated user ID
   * @returns 200 - Successfully left tournament
   */
  leaveTournament: {
    method: 'post' as const,
    url: (params: UserIdType) => `/tournament/leave/${params.userId}`,
    paramsSchema: userIdSchema,
    checkOwnership: async (data: { params?: UserIdType }, userId: string) => {
      return data.params?.userId === userId;
    },
    successCode: 200,
    errorMessages: {
      invalidParams: 'Invalid user ID',
      forbidden: 'Forbidden',
    },
  },
};
