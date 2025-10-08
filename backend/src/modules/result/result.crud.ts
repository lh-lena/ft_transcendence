import { prisma } from '../../plugins/001_prisma';
import { Prisma } from '@prisma/client';
import { leaderboardType, resultIdType, resultWinsLosesType } from '../../schemas/result';

const options = { include: { gamePlayed: true } };
type ResultWithGP = Prisma.ResultGetPayload<typeof options>;

export const resultModel = {
  findAll: async (): Promise<ResultWithGP[]> => {
    return await prisma.result.findMany(options);
  },

  findById: async (id: resultIdType): Promise<ResultWithGP | null> => {
    return await prisma.result.findUnique({ where: id, ...options });
  },

  findBy: async (where: Prisma.ResultWhereInput): Promise<ResultWithGP[]> => {
    return await prisma.result.findMany({ where, ...options });
  },

  insert: async (data: Prisma.ResultCreateInput): Promise<ResultWithGP> => {
    return await prisma.result.create({ data, ...options });
  },

  getWinsLoses: async (userId: string): Promise<resultWinsLosesType> => {
    const winsAndLosses = await prisma.gamePlayed.groupBy({
      by: ['isWinner'],
      where: { userId },
      _count: { id: true },
    });

    const wins = winsAndLosses.find((g) => g.isWinner)?.['_count'].id || 0;
    const loses = winsAndLosses.find((g) => !g.isWinner)?.['_count'].id || 0;

    console.log({ wins, loses });
    return { userId: userId, wins, loses };
  },

  getLeaderboard: async (): Promise<leaderboardType> => {
    const ret: leaderboardType = await prisma.$queryRaw`
      SELECT u.userId, COUNT(gp.id) AS wins 
      FROM user u 
      JOIN gamePlayed gp ON u.userId = gp.userId 
      WHERE gp.isWinner = true AND u.guest = false
      GROUP BY u.userId 
      ORDER BY wins DESC 
      LIMIT 8 OFFSET 0 
      `;
    return ret;
  },
};
