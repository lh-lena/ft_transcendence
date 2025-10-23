/**
 * Tournament Service
 *
 * Handles business logic for tournament management.
 *
 * Features:
 * - Bracket-style tournaments (4, 8, 16, 32 players)
 * - Automatic matchmaking and game creation
 * - Round progression
 * - Winner determination
 *
 * @module modules/tournament/service
 */

import type { FastifyInstance } from 'fastify';
import { GameService } from './game';
import { NotFoundError } from '../utils/error';
import { tournamentClass } from '../utils/tournament.class';

import type {
  tournamentCreateType,
  tournamentIdType,
  tournamentResponseType,
} from '../schemas/tournament';
import type { gameIdType } from '../schemas/game';
import type { userIdType } from '../schemas/user';

/**
 * Create tournament service instance
 *
 * @param server - Fastify instance for logging
 * @param gameService - Game service for creating matches
 */
export const createTournamentService = (server: FastifyInstance, gameService: GameService) => {
  const tournamentManager = new tournamentClass(server, gameService);

  return {
    /**
     * Join or create tournament
     *
     * Flow:
     * 1. Leave any existing tournament
     * 2. Find available tournament matching player count
     * 3. Create new tournament if none available
     * 4. Join tournament
     * 5. Start tournament if full
     *
     * @param data - Tournament join data
     * @returns Tournament that was joined
     */
    async create(data: tournamentCreateType): Promise<tournamentResponseType> {
      const { userId } = data;
      await tournamentManager.leave({ userId: userId });

      const tournament = await tournamentManager.findAvailableTournament(data);

      server.log.info(
        {
          tournamentId: tournament.tournamentId,
          userId: data.userId,
          playerAmount: tournament.playerAmount,
          currentPlayers: tournament.players.length,
        },
        'Player joined tournament',
      );

      return tournament;
    },

    /**
     * Get tournament by ID
     *
     * @param id - Tournament ID
     * @returns Tournament data
     * @throws NotFoundError if tournament doesn't exist
     */
    async getById(tournamentId: tournamentIdType): Promise<tournamentResponseType> {
      const tournament = await tournamentManager.getById(tournamentId);

      if (!tournament) {
        throw new NotFoundError(`Tournament with ID ${tournamentId.tournamentId} not found`);
      }

      return tournament;
    },

    /**
     * Update tournament after game ends
     *
     * Called by result service when tournament game finishes.
     * Handles:
     * - Player elimination
     * - Round progression
     * - Winner determination
     *
     * @param gameId - Game ID that finished
     * @param loserId - User ID of losing player
     */
    async update(gameId: gameIdType, loserId: userIdType): Promise<void> {
      await tournamentManager.update(gameId, loserId);
    },

    /**
     * Leave tournament
     *
     * Player voluntarily leaves tournament.
     * Notifies remaining players.
     *
     * @param userId - User ID leaving tournament
     * @returns true if left successfully, false if not in tournament
     */
    async leave(userId: userIdType): Promise<boolean> {
      const result = await tournamentManager.leave(userId);

      if (result) {
        server.log.info({ userId }, 'Player left tournament');
      }

      return result;
    },

    /**
     * Get tournament manager instance
     *
     * @returns Tournament class instance
     */
    getManager(): tournamentClass {
      return tournamentManager;
    },
  };
};

export type TournamentService = ReturnType<typeof createTournamentService>;
