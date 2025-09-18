import { prisma } from '../../plugins/001_prisma';
import { Prisma, Friendship } from '@prisma/client';

export const friendModel = {
  findAll: async (): Promise<Friendship[]> => {
    return await prisma.friendship.findMany();
  },

  findBy: async (where: Prisma.FriendshipWhereInput): Promise<Friendship[]> => {
    return await prisma.friendship.findMany({
      where,
    });
  },

  insert: async (data: Prisma.FriendshipCreateInput): Promise<Friendship> => {
    return await prisma.friendship.create({ data });
  },

  deleteOne: async (id: number): Promise<boolean> => {
    try {
      await prisma.friendship.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },
};
