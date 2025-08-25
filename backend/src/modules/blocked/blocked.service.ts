import { Prisma, Blocked } from '@prisma/client';
import { blockedModel } from './blocked.crud';
import type { blockedCreateType } from '../../schemas/blocked';

import { NotFoundError } from '../../utils/error';

import { transformInput } from './blocked.helper';

export const blockedService = {
  async create(data: blockedCreateType): Promise<Blocked> {
    const prismaData = await transformInput(data);
    try {
      const ret = await blockedModel.insert(prismaData);
      return ret;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new NotFoundError('blocked already exists');
      }
      throw err;
    }
  },

  async getQuery(query?: Prisma.BlockedWhereInput): Promise<Blocked[]> {
    const ret = query ? await blockedModel.findBy(query) : await blockedModel.findAll();

    if (ret.length === 0) {
      throw new NotFoundError('no blockeds found');
    }
    return ret;
  },

  async deleteOne(id: number): Promise<void> {
    const ret = await blockedModel.deleteOne(id);
    if (!ret) {
      throw new NotFoundError('blocked not found');
    }
  },
};
