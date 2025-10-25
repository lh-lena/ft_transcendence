/**
 * Result Service
 *
 * Handles business logic for game results and statistics.
 *
 * Features:
 * - Result creation with game cleanup
 * - Player statistics (wins/losses)
 * - Leaderboard generation
 * - Tournament integration
 *
 * @module modules/result/service
 */

import { Prisma } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { GameService } from './game';
import { TournamentService } from './tournament';
import { NotFoundError } from '../utils/error';

import type {
  resultCreateType,
  resultIdType,
  resultWinsLosesType,
  leaderboardType,
  resultResponseType,
} from '../schemas/result';
import type { userIdType } from '../schemas/user';

type ResultWithGP = Prisma.ResultGetPayload<{
  include: { gamePlayed: true };
}>;

/**
 * Transform result create input to Prisma format
 *
 * @param data - Result creation data
 * @returns Prisma-compatible create input
 */
function transformResultInput(data: resultCreateType): Prisma.ResultCreateInput {
  const winnerScore = Math.max(data.scorePlayer1, data.scorePlayer2);
  const loserScore = Math.min(data.scorePlayer1, data.scorePlayer2);

  const started = !isNaN(Number(data.startedAt))
    ? new Date(Number(data.startedAt))
    : new Date(data.startedAt);

  const finished = !isNaN(Number(data.finishedAt))
    ? new Date(Number(data.finishedAt))
    : new Date(data.finishedAt);

  return {
    gameId: data.gameId,
    status: data.status,
    startedAt: started,
    finishedAt: finished,
    gamePlayed: {
      create: [
        {
          user: { connect: { userId: data.winnerId } },
          score: winnerScore,
          isWinner: true,
        },
        {
          user: { connect: { userId: data.loserId } },
          score: loserScore,
          isWinner: false,
        },
      ],
    },
  };
}

/**
 * Transform result with relations to response format
 *
 * @param result - Result with game played relations
 * @returns Result response object
 */
function transformResultResponse(result: ResultWithGP): resultResponseType {
  const winner = result.gamePlayed.find((gp) => gp.isWinner);
  const loser = result.gamePlayed.find((gp) => !gp.isWinner);

  return {
    resultId: result.resultId,
    gameId: result.gameId,
    startedAt: result.startedAt.toISOString(),
    finishedAt: result.finishedAt.toISOString(),
    status: result.status,
    winnerId: winner?.userId,
    loserId: loser?.userId,
    winnerScore: winner?.score,
    loserScore: loser?.score,
  };
}

/**
 * Create result service instance with Prisma access
 *
 * @param server - Fastify instance with Prisma client
 * @param gameService - Game service for cleanup
 * @param tournamentService - Tournament service for updates
 */
export const createResultService = (
  server: FastifyInstance,
  gameService: GameService,
  tournamentService: TournamentService,
) => ({
  /**
   * Create game result
   *
   * Creates result record and triggers:
   * - Game cleanup
   * - Tournament progression
   *
   * @param data - Result creation data
   * @returns Created result with relations
   */
  async create(data: resultCreateType): Promise<resultResponseType> {
    const prismaData = transformResultInput(data);

    const result = await server.prisma.result.create({
      data: prismaData,
      include: { gamePlayed: true },
    });

    const { resultId, gameId } = result;
    const { loserId } = data;

    server.log.info({ resultId: resultId, gameId: gameId }, 'Result created');

    gameService.deleteOne({ gameId: gameId }).catch((error: Error) => {
      server.log.error({ error, gameId: gameId }, 'Failed to clean up game');
    });

    tournamentService.update({ gameId: gameId }, { userId: loserId }).catch((error: Error) => {
      server.log.error({ error, gameId: gameId }, 'Failed to update tournament');
    });

    return transformResultResponse(result);
  },

  /**
   * Query results
   *
   * @param query - Optional Prisma where clause
   * @returns Array of results with game played data
   */
  async getQuery(query?: Prisma.ResultWhereInput): Promise<resultResponseType[]> {
    const results = await server.prisma.result.findMany({
      where: query,
      include: { gamePlayed: true },
      orderBy: { finishedAt: 'desc' },
    });

    return results.map(transformResultResponse);
  },

  /**
   * Get result by ID
   *
   * @param id - Result ID
   * @returns Result with game played data
   * @throws NotFoundError if result doesn't exist
   */
  async getById(id: resultIdType): Promise<resultResponseType> {
    const result = await server.prisma.result.findUnique({
      where: id,
      include: { gamePlayed: true },
    });

    if (!result) {
      throw new NotFoundError(`Result with ID ${id.resultId} not found`);
    }

    return transformResultResponse(result);
  },

  /**
   * Get player wins and losses
   *
   * @param userId - User ID
   * @returns Win/loss statistics
   */
  async getWinsLoses(userId: userIdType): Promise<resultWinsLosesType> {
    const stats = await server.prisma.gamePlayed.groupBy({
      by: ['isWinner'],
      where: { userId: userId.userId },
      _count: { id: true },
    });

    const wins = stats.find((s) => s.isWinner)?._count.id || 0;
    const loses = stats.find((s) => !s.isWinner)?._count.id || 0;

    return { ...userId, wins, loses };
  },

  /**
   * Get leaderboard
   *
   * Returns top 8 players by win count.
   * Excludes guest users.
   *
   * @returns Leaderboard data
   */
  async getLeaderboard(): Promise<leaderboardType> {
    const leaderboard = await server.prisma.$queryRaw<leaderboardType>`
      SELECT u.userId, COUNT(gp.id) AS wins 
      FROM user u 
      JOIN gamePlayed gp ON u.userId = gp.userId 
      WHERE gp.isWinner = true AND u.guest = false
      GROUP BY u.userId 
      ORDER BY wins DESC 
      LIMIT ${server.config.LEADERBOARD_SIZE}
    `;

    return leaderboard;
  },
});

export type ResultService = ReturnType<typeof createResultService>;
