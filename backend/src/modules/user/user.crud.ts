import { prisma } from '../../plugins/001_prisma';
import { Prisma, user } from '@prisma/client'; // Adjust the import as needed

export const userCrud = {
  findAll: async (options?: Prisma.userFindManyArgs): Promise<user[]> => {
    return await prisma.user.findMany(options);
  },

  findById: async (
    id: number,
    options?: Omit<Prisma.userFindUniqueArgs, 'where'>,
  ): Promise<user | null> => {
    return await prisma.user.findUnique({ where: { id }, ...options });
  },

  findBy: async (
    where: Prisma.userWhereInput,
    options?: Omit<Prisma.userFindManyArgs, 'where'>,
  ): Promise<user[]> => {
    return await prisma.user.findMany({ where, ...options });
  },

  insert: async (
    data: Prisma.userCreateInput,
    options?: Omit<Prisma.userCreateArgs, 'data'>,
  ): Promise<user> => {
    return await prisma.user.create({ data, ...options });
  },

  patch: async (
    id: number,
    data: Prisma.userUpdateInput,
    options?: Omit<Prisma.userUpdateArgs, 'data' | 'where'>,
  ): Promise<user> => {
    return await prisma.user.update({ where: { id }, data, ...options });
  },

  deleteOne: async (
    id: number,
    options?: Omit<Prisma.userDeleteArgs, 'where'>,
  ): Promise<user> => {
    return await prisma.user.delete({ where: { id }, ...options });
  },
};
