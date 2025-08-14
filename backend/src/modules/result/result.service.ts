import { resultModel } from './result.crud';
import { NotFoundError, ConflictError } from '../../utils/error';
import { Prisma, result } from '@prisma/client';

import { resultCreateInput } from '../../schemas/result';

import { transformInput } from './result.helper';
import { transformQuery } from '../..//utils/crudQueryBuilder';

export const resultService = {
  async create(data: resultCreateInput): Promise<result> {
    const prismaData = await transformInput(data);

    try {
      const ret = await resultModel.insert(prismaData);
      return ret;
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictError(`result already exists`);
      }
      throw err;
    }
  },

  async getQuery(query?: Prisma.resultWhereInput): Promise<result[]> {
    const ret = query
      ? await resultModel.findBy(transformQuery(query))
      : await resultModel.findAll();

    if (ret.length === 0) {
      throw new NotFoundError('No result found');
    }
    return ret;
  },

  async getById(id: number): Promise<result> {
    const ret = await resultModel.findById(id);

    if (!ret) throw new NotFoundError(`result with ${id} not found`);

    return ret;
  },
};
