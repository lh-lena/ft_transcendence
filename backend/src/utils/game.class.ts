/**
 * Game Class - In-Memory Game State Manager
 *
 * Manages active game sessions in memory.
 * Handles matchmaking, game lifecycle, and player management.
 *
 * @module modules/game/class
 */

import { v4 as uuid } from 'uuid';
import type { FastifyInstance } from 'fastify';
import type { gameType, gameIdType, gameCreateType } from '../schemas/game';
import { userIdType } from '../schemas/user';

/**
 * Game Manager Class
 *
 * Keeps track of all active games in memory.
 * Does not persist to database - games are ephemeral.
 */
export class gameClass {
  private activeGames: gameType[] = [];
  private server: FastifyInstance;

  constructor(server: FastifyInstance) {
    this.server = server;
  }

  /**
   * Get game by ID
   *
   * @param gameId - Unique game identifier
   * @returns Game or undefined if not found
   */
  async getById(gameId: gameIdType): Promise<gameType | undefined> {
    return this.activeGames.find((g) => g.gameId === gameId.gameId);
  }

  /**
   * Get game by user ID
   *
   * Finds game where user is a player.
   *
   * @param userId - User ID to search for
   * @returns Game or undefined if user not in any game
   */
  async getByUser(userId: userIdType): Promise<gameType | undefined> {
    return this.activeGames.find((g) => g.players.some((p) => p.userId === userId.userId));
  }

  /**
   * Create new game
   *
   * Prevents duplicate games for same user.
   * Automatically adds creator as first player.
   *
   * @param data - Game creation data
   * @returns Created game
   */
  async create(data: gameCreateType): Promise<gameType> {
    const { userId } = data;

    const existingGame = await this.getByUser({ userId: userId });
    if (existingGame) {
      this.server.log.warn(
        { userId: data.userId, existingGameId: existingGame.gameId },
        'User already in game, returning existing',
      );
      return existingGame;
    }

    const newGame: gameType = {
      gameId: uuid(),
      players: [{ userId: data.userId }],
      mode: data.mode,
      status: 'waiting',
      visibility: data.visibility,
      aiDifficulty: data.aiDifficulty || 'easy',
    };

    this.activeGames.push(newGame);
    this.startGame(newGame);

    return newGame;
  }

  /**
   * Remove game
   *
   * Cleans up finished or abandoned games.
   * Note: Does not notify players about end.
   *
   * @param gameId - Game ID to remove
   */
  async remove(gameId: gameIdType): Promise<void> {
    const initialCount = this.activeGames.length;
    this.activeGames = this.activeGames.filter((g) => g.gameId !== gameId.gameId);

    if (this.activeGames.length < initialCount) {
      this.server.log.info({ gameId }, 'Game removed from active games');
    }
  }

  /**
   * Add player to game
   *
   * @param game - Game to join
   * @param userId - User ID of joining player
   * @returns Updated game
   */
  async join(game: gameType, userId: userIdType): Promise<gameType> {
    if (game.players.some((p) => p.userId === userId.userId)) {
      this.server.log.warn({ gameId: game.gameId, userId }, 'Player already in game');
      return game;
    }

    game.players.push(userId);
    this.startGame(game);

    return game;
  }

  /**
   * Find or create available public game
   *
   * Matchmaking logic:
   * 1. Check if user already in a game
   * 2. Find available public game
   * 3. Create new game if none available
   *
   * @param userId - User ID looking for game
   * @returns Available game (existing or new)
   */
  async findAvailableGame(userId: userIdType): Promise<gameType> {
    const existingGame = await this.getByUser(userId);
    if (existingGame) {
      return existingGame;
    }

    const availableGame = this.activeGames.find(
      (g) =>
        g.players.length < 2 &&
        g.visibility === 'public' &&
        g.status === 'waiting' &&
        !g.players.some((p) => p.userId === userId.userId),
    );

    if (availableGame) {
      await this.join(availableGame, userId);

      this.server.log.info(
        {
          gameId: availableGame.gameId,
          userId,
        },
        'Joined existing public game',
      );

      return availableGame;
    }

    const newGame = await this.create({
      mode: 'pvp_remote',
      visibility: 'public',
      ...userId,
    });

    this.server.log.info(
      { gameId: newGame.gameId, userId },
      'Created new public game for matchmaking',
    );
    return newGame;
  }

  /**
   * Attempt to start game
   *
   * Game starts when:
   * - PvP Remote: 2 players joined
   * - AI Mode: 1 player joined
   *
   * Sends real-time notification to players when game starts.
   *
   * @param game - Game to potentially start
   */
  private startGame(game: gameType): void {
    const shouldStart =
      (game.players.length === 2 && game.mode === 'pvp_remote') ||
      (game.players.length === 1 && game.mode === 'pvb_ai');

    if (shouldStart && game.status !== 'ready') {
      game.status = 'ready';
      game.createdAt = new Date().toISOString();

      this.server.log.info(
        {
          gameId: game.gameId,
          mode: game.mode,
          playerCount: game.players.length,
        },
        'Game started',
      );

      this.server.realtime.sendGameStart(game).catch((error) => {
        this.server.log.error(
          { error, gameId: game.gameId },
          'Failed to send game start notification',
        );
      });
    }
  }

  /**
   * Get all active games (for debugging/monitoring)
   *
   * @returns Array of active games
   */
  getActiveGames(): gameType[] {
    return [...this.activeGames];
  }

  /**
   * Get active game count (for monitoring)
   *
   * @returns Number of active games
   */
  getActiveGameCount(): number {
    return this.activeGames.length;
  }
}
