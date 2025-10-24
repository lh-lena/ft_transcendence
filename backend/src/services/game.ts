/**
 * Game Service
 *
 * Handles business logic for game management.
 *
 * Features:
 * - In-memory game state management
 * - Matchmaking for public games
 * - Private game creation
 * - AI game support
 * - Real-time game start notifications
 *
 * @module modules/game/service
 */

import type { FastifyInstance } from 'fastify';
import { NotFoundError } from '../utils/error';
import { gameClass } from '../utils/game.class';

import type { gameType, gameIdType, gameJoinType, gameCreateType } from '../schemas/game';
import type { userIdType } from '../schemas/user';

/**
 * Create game service instance
 *
 * Uses singleton pattern for game state management.
 * All game state is kept in-memory for performance.
 *
 * @param server - Fastify instance for logging
 */
export const createGameService = (server: FastifyInstance) => {
  const gameManager = new gameClass(server);

  return {
    /**
     * Get game by ID
     *
     * @param id - Game ID
     * @returns Game state
     * @throws NotFoundError if game doesn't exist
     */
    async getById(gameId: gameIdType): Promise<gameType> {
      const game = await gameManager.getById(gameId);

      if (!game) {
        throw new NotFoundError(`Game ${gameId} not found`);
      }

      return game;
    },

    /**
     * Create new game
     *
     * Prevents duplicate games for the same user.
     * Automatically starts game if AI mode.
     *
     * @param data - Game creation data
     * @returns Created game
     */
    async create(data: gameCreateType): Promise<gameType> {
      const game = await gameManager.create(data);

      server.log.info(
        {
          gameId: game.gameId,
          mode: game.mode,
          visibility: game.visibility,
        },
        'Game created',
      );

      return game;
    },

    /**
     * Join game
     *
     * Handles both:
     * - Joining specific game by ID
     * - Matchmaking to random available game
     *
     * @param data - Join request data
     * @returns Game that was joined
     */
    async join(data: gameJoinType): Promise<gameType> {
      const { gameId, userId } = data;
      let game: gameType;

      if (gameId) {
        const existingGame = await this.getById({ gameId: gameId });
        game = await gameManager.join(existingGame, { userId: userId });

        server.log.info(
          { gameId: data.gameId, userId: data.userId },
          'Player joined specific game',
        );
      } else {
        game = await gameManager.findAvailableGame({ userId: userId });

        server.log.info({ gameId: gameId, userId: userId }, 'Player joined via matchmaking');
      }

      return game;
    },

    /**
     * Create tournament game
     *
     * Creates private game for tournament matches.
     * Both players are automatically added.
     *
     * @param player1 - First player user ID
     * @param player2 - Second player user ID
     * @returns Created tournament game
     */
    async createTournamentGame(player1: userIdType, player2: userIdType): Promise<gameType> {
      const game = await gameManager.create({
        mode: 'pvp_remote',
        visibility: 'private',
        userId: player1.userId,
      });

      await gameManager.join(game, { userId: player2.userId });

      server.log.info(
        {
          gameId: game.gameId,
          player1,
          player2,
        },
        'Tournament game created',
      );

      return game;
    },

    /**
     * Delete/cleanup game
     *
     * Removes game from active games list.
     * Called when game ends or is abandoned.
     *
     * @param id - Game ID
     */
    async deleteOne(gameId: gameIdType): Promise<void> {
      server.log.debug({ gameId }, 'Cleaning up game');
      const game = await gameManager.getById(gameId);

      if (game) {
        await gameManager.remove(gameId);

        server.log.info({ gameId }, 'Game cleaned up');
      }
    },

    /**
     * Get game manager instance
     *
     * Useful for direct access in specific scenarios.
     *
     * @returns Game class instance
     */
    getManager(): gameClass {
      return gameManager;
    },
  };
};

export type GameService = ReturnType<typeof createGameService>;
