import { prisma } from '../../plugins/001_prisma';
import { Prisma } from '@prisma/client'; // Adjust the import as needed

const options = { include: { gamePlayed: true } };

import {
  userResponseSchema,
  userResponseArraySchema,
  userResponseType,
  userResponseArrayType,
} from '../../schemas/user';

export const userCrud = {
  findAll: async (): Promise<userResponseArrayType> => {
    const ret = await prisma.user.findMany(options);
    console.log(ret);

    if (ret) return userResponseArraySchema.parse(ret);

    return ret;
  },

  findById: async (id: number): Promise<userResponseType | null> => {
    const ret = await prisma.user.findUnique({ where: { id }, ...options });

    if (ret) return userResponseSchema.parse(ret);

    return ret;
  },

  findBy: async (
    where: Prisma.userWhereInput,
  ): Promise<userResponseArrayType> => {
    const ret = await prisma.user.findMany({ where, ...options });

    console.log(ret);
    if (ret) return userResponseArraySchema.parse(ret);

    return ret;
  },

  insert: async (data: Prisma.userCreateInput): Promise<userResponseType> => {
    const ret = await prisma.user.create({ data, ...options });

    if (ret) return userResponseSchema.parse(ret);

    return ret;
  },

  patch: async (
    id: number,
    data: Prisma.userUpdateInput,
  ): Promise<userResponseType> => {
    const ret = await prisma.user.update({ where: { id }, data, ...options });

    if (ret) return userResponseSchema.parse(ret);

    return ret;
  },

  deleteOne: async (id: number): Promise<{ success: true | false }> => {
    const ret = await prisma.user.delete({ where: { id }, ...options });

    if (!ret) return { success: true };
    else return { success: false };
  },
};
