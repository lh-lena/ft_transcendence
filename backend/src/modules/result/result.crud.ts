import { prisma } from '../../plugins/001_prisma';
import { Prisma, result } from '@prisma/client';

const options = { include: { gamePlayed: { include: { user: true } } } };

export const resultCrud = {
  findAll: async (options?: Prisma.resultFindManyArgs): Promise<result[]> => {
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

  patch: async (
    id: number,
    data: Prisma.resultUpdateInput,
  ): Promise<result> => {
    return await prisma.result.update({ where: { id }, data, ...options });
  },

  deleteOne: async (id: number): Promise<result> => {
    return await prisma.result.delete({ where: { id }, ...options });
  },
};
