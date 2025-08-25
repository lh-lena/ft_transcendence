import { prisma } from '../../plugins/001_prisma';
import { Prisma, Result } from '@prisma/client';
import { leaderboardType } from '../../schemas/result';

const options = { include: { gamePlayed: { include: { user: true } } } };

export const resultModel = {
  findAll: async (): Promise<Result[]> => {
    return await prisma.result.findMany(options);
  },

  findById: async (id: number): Promise<Result | null> => {
    return await prisma.result.findUnique({ where: { id }, ...options });
  },

  findBy: async (where: Prisma.ResultWhereInput): Promise<Result[]> => {
    return await prisma.result.findMany({ where, ...options });
  },

  insert: async (data: Prisma.ResultCreateInput): Promise<Result> => {
    return await prisma.result.create({ data, ...options });
  },

  getLeaderboard: async (): Promise<leaderboardType> => {
    const ret: leaderboardType = await prisma.$queryRaw`
      SELECT u.id, u.username, COUNT(gp.id) AS wins 
      FROM user u 
      JOIN gamePlayed gp ON u.id = gp.userId 
      WHERE guest = false
      WHERE gp.isWinner = true 
      GROUP BY u.id, u.username 
      ORDER BY wins DESC 
      LIMIT 5 OFFSET 0 
      `;
    console.log(ret);
    return ret;
  },
};
