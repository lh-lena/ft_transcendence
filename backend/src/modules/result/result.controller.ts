import { Prisma } from '@prisma/client';
import { resultService } from './result.service';

import type { resultType, resultCreateType } from '../../schemas/result';
import { transformResult } from './result.helper';

export const resultController = {
  //controller to create an result
  async create(data: resultCreateType): Promise<resultType> {
    const ret = await resultService.create(data);
    return transformResult(ret);
  },

  //controller for result get All or by Id
  async getQuery(query?: Prisma.resultWhereInput): Promise<resultType[]> {
    const ret = await resultService.getQuery(query);
    return Promise.all(ret.map((r) => transformResult(r)));
  },

  async getById(id: number): Promise<resultType> {
    const ret = await resultService.getById(id);
    return transformResult(ret);
  },
};
