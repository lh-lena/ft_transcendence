import { prisma } from '../../plugins/001_prisma';
import { Prisma, User } from '@prisma/client'; // Adjust the import as needed

export const userModel = {
  findAll: async (): Promise<User[]> => {
    const tmp = await prisma.user.findMany();
    return tmp;
  },

  findById: async (userId: string): Promise<User | null> => {
    return await prisma.user.findUnique({ where: { userId } });
  },

  findBy: async (where: Prisma.UserWhereInput): Promise<User[]> => {
    console.log(where);
    const ret = await prisma.user.findMany({ where });
    return ret;
  },

  insert: async (data: Prisma.UserCreateInput): Promise<User> => {
    return await prisma.user.create({ data });
  },

  patch: async (userId: string, data: Prisma.UserUpdateInput): Promise<User> => {
    return await prisma.user.update({ where: { userId }, data });
  },

  deleteOne: async (userId: string): Promise<boolean> => {
    try {
      await prisma.user.delete({ where: { userId } });
      return true;
    } catch {
      return false;
    }
  },
};
