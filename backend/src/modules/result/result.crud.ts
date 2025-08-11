import { prisma } from '../../plugins/001_prisma';
import { Prisma } from '@prisma/client';
import {
  resultResponseSchema,
  resultResponseArraySchema,
  resultResponseType,
  resultResponseArrayType,
} from '../../schemas/result';

const options = { include: { gamePlayed: { include: { user: true } } } };

export const resultCrud = {
  findAll: async (): Promise<resultResponseArrayType> => {
    const ret = await prisma.result.findMany(options);

    if (ret) return resultResponseArraySchema.parse(ret);

    return ret;
  },

  findById: async (id: number): Promise<resultResponseType | null> => {
    const ret = await prisma.result.findUnique({ where: { id }, ...options });

    if (ret) return resultResponseSchema.parse(ret);

    return ret;
  },

  findBy: async (
    where: Prisma.resultWhereInput,
  ): Promise<resultResponseArrayType> => {
    console.log(where);
    const ret = await prisma.result.findMany({ where, ...options });
    console.log(ret);

    if (ret) return resultResponseArraySchema.parse(ret);

    return ret;
  },

  insert: async (
    data: Prisma.resultCreateInput,
  ): Promise<resultResponseType> => {
    console.log(data);

    const ret = await prisma.result.create({ data, ...options });

    if (ret) return resultResponseSchema.parse(ret);

    return ret;
  },

  patch: async (
    id: number,
    data: Prisma.resultUpdateInput,
  ): Promise<resultResponseType> => {
    const ret = await prisma.result.update({ where: { id }, data, ...options });

    if (ret) return resultResponseSchema.parse(ret);

    return ret;
  },

  deleteOne: async (id: number): Promise<{ success: true | false }> => {
    const ret = await prisma.result.delete({ where: { id }, ...options });

    if (ret) return { success: true };
    else return { success: false };
  },
};
