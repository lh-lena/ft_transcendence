/**
 * Tournament Class - In-Memory Tournament State Manager
 *
 * Manages active tournaments in memory.
 * Handles bracket creation, round progression, and winner determination.
 *
 * @module services/tournament/class
 */

import { v4 as uuidv4 } from 'uuid';
import type { FastifyInstance } from 'fastify';
import { GameService } from '../services/game';

import type { tournamentType, tournamentCreateType, tournamentIdType } from '../schemas/tournament';
import type { userIdType } from '../schemas/user';
import type { gameIdType } from '../schemas/game';

/**
 * Tournament Manager Class
 *
 * Keeps track of all active tournaments in memory.
 * Tournaments support 4, 8, 16, or 32 players.
 */
export class tournamentClass {
  private activeTournaments: tournamentType[] = [];
  private server: FastifyInstance;
  private gameService?: GameService;

  constructor(server: FastifyInstance, gameService?: GameService) {
    this.server = server;
    this.gameService = gameService;
  }

  /**
   * Set game service (for dependency injection after creation)
   *
   * @param gameService - Game service instance
   */
  setGameService(gameService: GameService): void {
    this.gameService = gameService;
  }

  /**
   * Get tournament by ID
   *
   * @param id - Tournament ID
   * @returns Tournament or undefined if not found
   */
  async getById(id: tournamentIdType): Promise<tournamentType | undefined> {
    this.server.log.debug({ id, tournaments: this.activeTournaments }, 'Fetching tournament by ID');
    return this.activeTournaments.find((t) => t.tournamentId === id.tournamentId);
  }

  /**
   * Get tournament by user
   *
   * Finds tournament where user is a participant.
   *
   * @param userId - User ID to search for
   * @returns Tournament or undefined if user not in any tournament
   */
  async getByUser(userId: userIdType): Promise<tournamentType | undefined> {
    return this.activeTournaments.find((t) => t.players.some((p) => p.userId === userId.userId));
  }

  /**
   * Create new tournament
   *
   * @param playerAmount - Total players (4, 8, 16, or 32)
   * @returns Created tournament
   */
  async create(playerAmount: number): Promise<tournamentType> {
    const newTournament: tournamentType = {
      tournamentId: uuidv4(),
      round: 1,
      playerAmount: playerAmount,
      players: [],
      status: 'waiting',
      games: [],
    };

    this.activeTournaments.push(newTournament);

    this.server.log.info(
      { tournamentId: newTournament.tournamentId, playerAmount },
      'Tournament created',
    );

    return newTournament;
  }

  /**
   * Remove tournament
   *
   * @param tournamentId - Tournament ID to remove
   */
  async remove(tournamentId: tournamentIdType): Promise<void> {
    const initialCount = this.activeTournaments.length;
    this.activeTournaments = this.activeTournaments.filter(
      (t) => t.tournamentId !== tournamentId.tournamentId,
    );

    if (this.activeTournaments.length < initialCount) {
      this.server.log.info({ tournamentId }, 'Tournament removed');
    }
  }

  /**
   * Add player to tournament
   *
   * Notifies existing players about new participant.
   *
   * @param tournament - Tournament to join
   * @param playerId - User ID of joining player
   * @returns Updated tournament
   */
  async join(tournament: tournamentType, playerId: userIdType): Promise<tournamentType> {
    if (tournament.players.some((p) => p.userId === playerId.userId)) {
      return tournament;
    }

    tournament.players.push({ userId: playerId.userId });

    for (const player of tournament.players) {
      if (player.userId === playerId.userId) continue;

      this.server.realtime.notifyPlayer(
        player.userId,
        `INFO: New player joined the tournament`,
        playerId.userId,
      );
    }

    this.server.log.info(
      {
        tournamentId: tournament.tournamentId,
        playerId,
        currentPlayers: tournament.players.length,
        requiredPlayers: tournament.playerAmount,
      },
      'Player joined tournament',
    );

    return tournament;
  }

  /**
   * Remove player from tournament
   *
   * Notifies remaining players about departure.
   *
   * @param userId - User ID leaving tournament
   * @returns true if player was in tournament, false otherwise
   */
  async leave(userId: userIdType): Promise<boolean> {
    const tournament = await this.getByUser(userId);

    if (!tournament) {
      return false;
    }

    const initialPlayerCount = tournament.players.length;
    tournament.players = tournament.players.filter((p) => p.userId !== userId.userId);

    if (tournament.players.length < initialPlayerCount) {
      for (const player of tournament.players) {
        this.server.realtime.notifyPlayer(
          player.userId,
          `INFO: Player left the tournament`,
          userId.userId,
        );
      }

      this.server.log.info(
        {
          tournamentId: tournament.tournamentId,
          userId,
          remainingPlayers: tournament.players.length,
        },
        'Player left tournament',
      );

      return true;
    }

    return false;
  }

  /**
   * Find or create available tournament
   *
   * Matchmaking logic:
   * 1. Find waiting tournament with matching player amount
   * 2. Create new tournament if none available
   * 3. Join tournament
   * 4. Start if full
   *
   * @param data - Tournament join data
   * @returns Available tournament
   */
  async findAvailableTournament(data: tournamentCreateType): Promise<tournamentType> {
    const { userId } = data;
    let tournament = this.activeTournaments.find(
      (t) =>
        t.playerAmount === data.playerAmount &&
        t.players.length < t.playerAmount &&
        t.status === 'waiting',
    );

    if (!tournament) {
      tournament = await this.create(data.playerAmount);
    }

    await this.join(tournament, { userId: userId });
    await this.startTournament(tournament);

    return tournament;
  }

  /**
   * Create bracket games for current round
   *
   * Pairs up players and creates games.
   *
   * @param tournament - Tournament to create games for
   */
  private async createGames(tournament: tournamentType): Promise<void> {
    if (!this.gameService) {
      this.server.log.error(
        { tournamentId: tournament.tournamentId },
        'Cannot create tournament games: gameService not initialized',
      );
      return;
    }

    const games = [];

    for (let i = 0; i < tournament.players.length; i += 2) {
      try {
        const game = await this.gameService.createTournamentGame(
          { userId: tournament.players[i].userId },
          { userId: tournament.players[i + 1].userId },
        );

        games.push(game);
      } catch (error) {
        this.server.log.error(
          {
            error,
            tournamentId: tournament.tournamentId,
            player1: tournament.players[i].userId,
            player2: tournament.players[i + 1]?.userId,
          },
          'Failed to create tournament game',
        );
      }
    }

    tournament.games = games;

    this.server.log.info(
      {
        tournamentId: tournament.tournamentId,
        round: tournament.round,
        gamesCreated: games.length,
      },
      'Tournament bracket games created',
    );
  }

  /**
   * Start tournament when full
   *
   * Creates initial bracket games and notifies players.
   *
   * @param tournament - Tournament to start
   */
  private async startTournament(tournament: tournamentType): Promise<void> {
    const isFull = tournament.players.length === tournament.playerAmount;
    const isWaiting = tournament.status === 'waiting';

    if (isFull && isWaiting) {
      tournament.status = 'ready';

      for (const player of tournament.players) {
        this.server.realtime.notifyPlayer(player.userId, `INFO: Tournament starts soon`);
      }

      await this.createGames(tournament);

      this.server.log.info(
        {
          tournamentId: tournament.tournamentId,
          playerAmount: tournament.playerAmount,
        },
        `Tournament ${tournament.tournamentId} started`,
      );
    }
  }

  /**
   * Start tournament when full
   *
   * Creates initial bracket games and notifies players.
   *
   * @param tournament - Tournament to start
   */
  private async startRound(tournament: tournamentType): Promise<void> {
    for (const player of tournament.players) {
      this.server.realtime.notifyPlayer(
        player.userId,
        `INFO: Tournament round: ${tournament.round} starts soon`,
      );
    }

    await this.createGames(tournament);

    this.server.log.info(
      {
        tournamentId: tournament.tournamentId,
        playerAmount: tournament.playerAmount,
      },
      `Tournament ${tournament.tournamentId} round ${tournament.round} started`,
    );
  }

  /**
   * Update tournament after game ends
   *
   * Handles:
   * - Player elimination
   * - Round progression
   * - Winner determination
   * - Tournament cleanup when complete
   *
   * @param gameId - Finished game ID
   * @param loserId - Eliminated player ID
   */
  async update(gameId: gameIdType, loserId: userIdType): Promise<void> {
    const tournament = this.activeTournaments.find((t) =>
      t.games.some((g) => g.gameId === gameId.gameId),
    );

    if (!tournament) {
      return;
    }

    if (this.gameService) await this.gameService.deleteOne(gameId);

    tournament.games = tournament.games.filter((g) => g.gameId !== gameId.gameId);

    tournament.players = tournament.players.filter((p) => p.userId !== loserId.userId);

    this.server.services.user.update(loserId, { alias: null });

    this.server.log.info(
      {
        tournamentId: tournament.tournamentId,
        gameId,
        loserId,
        remainingPlayers: tournament.players.length,
        remainingGames: tournament.games.length,
      },
      'Tournament game finished',
    );

    if (tournament.players.length === 1) {
      const winner = tournament.players[0];

      this.server.realtime.notifyPlayer(winner.userId, 'INFO: You won the tournament!');

      this.server.log.info(
        {
          tournamentId: tournament.tournamentId,
          winnerId: winner.userId,
        },
        'Tournament completed',
      );

      await this.remove({ tournamentId: tournament.tournamentId });
      return;
    }

    if (tournament.games.length === 0) {
      tournament.round += 1;
      tournament.playerAmount = tournament.players.length;

      this.server.log.info(
        {
          tournamentId: tournament.tournamentId,
          round: tournament.round,
          players: tournament.players.length,
        },
        'Tournament advancing to next round',
      );

      this.startRound(tournament);
    }
  }

  /**
   * Get all active tournaments (for debugging/monitoring)
   *
   * @returns Array of active tournaments
   */
  getActiveTournaments(): tournamentType[] {
    return [...this.activeTournaments];
  }

  /**
   * Get active tournament count (for monitoring)
   *
   * @returns Number of active tournaments
   */
  getActiveTournamentCount(): number {
    return this.activeTournaments.length;
  }
}
