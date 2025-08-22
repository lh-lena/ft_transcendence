import { prisma } from '../../plugins/001_prisma';
import { Prisma, friend } from '@prisma/client';

export const friendModel = {
  findAll: async (): Promise<friend[]> => {
    return await prisma.friend.findMany();
  },

  findBy: async (where: Prisma.friendWhereInput): Promise<friend[]> => {
    return await prisma.friend.findMany({
      where,
    });
  },

  insert: async (data: Prisma.friendCreateInput): Promise<friend> => {
    return await prisma.friend.create({ data });
  },

  deleteOne: async (id: number): Promise<boolean> => {
    try {
      await prisma.friend.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },
};
