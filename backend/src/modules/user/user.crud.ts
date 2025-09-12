import { prisma } from '../../plugins/001_prisma';
import { Prisma, User } from '@prisma/client'; // Adjust the import as needed

const options = { include: { gamePlayed: true } };

export const userModel = {
  findAll: async (): Promise<User[]> => {
    return await prisma.user.findMany(options);
  },

  findById: async (userId: string): Promise<User | null> => {
    return await prisma.user.findUnique({ where: { userId }, ...options });
  },

  findBy: async (where: Prisma.UserWhereInput): Promise<User[]> => {
    return await prisma.user.findMany({ where, ...options });
  },

  insert: async (data: Prisma.UserCreateInput): Promise<User> => {
    return await prisma.user.create({ data, ...options });
  },

  patch: async (userId: string, data: Prisma.UserUpdateInput): Promise<User> => {
    return await prisma.user.update({ where: { userId }, data, ...options });
  },

  deleteOne: async (userId: string): Promise<boolean> => {
    try {
      await prisma.user.delete({ where: { userId }, ...options });
      return true;
    } catch {
      return false;
    }
  },
};
