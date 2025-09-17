import { Prisma } from '@prisma/client';
import { resultService } from './result.service';

import { resultResponse, resultResponseArray } from '../../schemas/result';
import type {
  resultCreateType,
  resultResponseType,
  resultResponseArrayType,
  resultIdType,
  leaderboardType,
} from '../../schemas/result';

export const resultController = {
  //controller to create an result
  async create(data: resultCreateType): Promise<resultResponseType> {
    const ret = await resultService.create(data);

    const result = resultResponse.safeParse(ret);

    if (!result.success) {
      throw new Error('Result parsing failed');
    }

    const resultRet: resultResponseType = result.data;

    return resultRet;
  },

  //controller for result get All or by Id
  async getQuery(query?: Prisma.ResultWhereInput): Promise<resultResponseArrayType> {
    const ret = await resultService.getQuery(query);

    const result = resultResponseArray.safeParse(ret);

    if (!result.success) {
      throw new Error('Result parsing failed');
    }

    const resultRet: resultResponseArrayType = result.data;

    return resultRet;
  },

  async getById(id: resultIdType): Promise<resultResponseType> {
    const ret = await resultService.getById(id);

    const result = resultResponse.safeParse(ret);

    if (!result.success) {
      throw new Error('Result parsing failed');
    }

    const resultRet: resultResponseType = result.data;

    return resultRet;
  },

  async getLeaderboard(): Promise<leaderboardType> {
    const ret = await resultService.getLeaderboard();
    return ret;
  },
};
