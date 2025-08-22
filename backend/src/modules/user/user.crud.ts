import { prisma } from '../../plugins/001_prisma';
import { Prisma, user } from '@prisma/client'; // Adjust the import as needed

const options = { include: { gamePlayed: true } };

export const userModel = {
  findAll: async (): Promise<user[]> => {
    return await prisma.user.findMany(options);
  },

  findById: async (id: number): Promise<user | null> => {
    return await prisma.user.findUnique({ where: { id }, ...options });
  },

  findBy: async (where: Prisma.userWhereInput): Promise<user[]> => {
    return await prisma.user.findMany({ where, ...options });
  },

  insert: async (data: Prisma.userCreateInput): Promise<user> => {
    return await prisma.user.create({ data, ...options });
  },

  patch: async (id: number, data: Prisma.userUpdateInput): Promise<user> => {
    return await prisma.user.update({ where: { id }, data, ...options });
  },

  deleteOne: async (id: number): Promise<boolean> => {
    try {
      await prisma.user.delete({ where: { id }, ...options });
      return true;
    } catch {
      return false;
    }
  },
};
