import { prisma } from '../../plugins/001_prisma';
import { Prisma, Blocked } from '@prisma/client';

import type { blockedIdType } from '../../schemas/blocked';

export const blockedModel = {
  findAll: async (): Promise<Blocked[]> => {
    return await prisma.blocked.findMany();
  },

  findBy: async (where: Prisma.BlockedWhereInput): Promise<Blocked[]> => {
    return await prisma.blocked.findMany({
      where,
    });
  },

  insert: async (data: Prisma.BlockedCreateInput): Promise<Blocked> => {
    return await prisma.blocked.create({ data });
  },

  deleteOne: async (id: blockedIdType): Promise<boolean> => {
    try {
      await prisma.blocked.delete({ where: id });
      return true;
    } catch {
      return false;
    }
  },
};
