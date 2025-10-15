import { userIdSchema } from '../schemas/user';
import type { UserIdType } from '../schemas/user';

import { tournamentIdSchema, tournamentCreateSchema } from '../schemas/tournament';
import type { TournamentIdType } from '../schemas/tournament';

export const tournamentRoutesConfig = {
  getTournament: {
    method: 'get' as const,
    url: (params: TournamentIdType) => `/tournament/${params.tournamentId}`,
    paramsSchema: tournamentIdSchema,
    successCode: 200,
    errorMessages: {
      invalidParams: 'Invalid tournament ID',
    },
  },

  joinTournament: {
    method: 'post' as const,
    url: `/tournament`,
    bodySchema: tournamentCreateSchema,
    successCode: 201,
    errorMessages: {
      invalidBody: 'Inalid tournament creation data',
    },
  },

  leaveTournament: {
    method: 'post' as const,
    url: (params: UserIdType) => `/tournament/leave/${params.userId}`,
    paramsSchema: userIdSchema,
    checkOwnership: async (data: { params?: UserIdType }, userId: string) => {
      return data.params?.userId === userId;
    },
    successCode: 204,
    errorMessages: {
      invalidParams: 'Invalid user ID',
      forbidden: 'Forbidden',
    },
  },
};
