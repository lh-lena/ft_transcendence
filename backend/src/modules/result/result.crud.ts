import { prisma } from '../../plugins/001_prisma';
import { Prisma, result } from '@prisma/client';
import { leaderboardType } from '../../schemas/result';

const options = { include: { gamePlayed: { include: { user: true } } } };

export const resultModel = {
  findAll: async (): Promise<result[]> => {
    return await prisma.result.findMany(options);
  },

  findById: async (id: number): Promise<result | null> => {
    return await prisma.result.findUnique({ where: { id }, ...options });
  },

  findBy: async (where: Prisma.resultWhereInput): Promise<result[]> => {
    return await prisma.result.findMany({ where, ...options });
  },

  insert: async (data: Prisma.resultCreateInput): Promise<result> => {
    return await prisma.result.create({ data, ...options });
  },

  getLeaderboard: async (): Promise<leaderboardType> => {
    const ret = await prisma.$queryRaw`
      SELECT u.id, u.username, COUNT(gp.id) AS wins 
      FROM user u 
      JOIN gamePlayed gp ON u.id = gp.userId 
      WHERE gp.isWinner = true 
      GROUP BY u.id, u.username 
      ORDER BY wins DESC 
      LIMIT 5 OFFSET 0 
      `;
    console.log(ret);
    return ret;
  },
};
