import { Prisma } from '@prisma/client';
import { resultService } from './result.service';
import { transformResult, transformResultArray } from './result.helper';
import { resultResponse, resultResponseArray } from '../../schemas/result';
import type {
  resultCreateType,
  resultResponseType,
  resultResponseArrayType,
  resultIdType,
  resultWinsLosesType,
  leaderboardType,
} from '../../schemas/result';

import type { userIdType } from '../../schemas/user';

export const resultController = {
  //controller to create an result
  async create(data: resultCreateType): Promise<resultResponseType> {
    const ret = await resultService.create(data);

    const result = resultResponse.safeParse(transformResult(ret));

    if (!result.success) {
      throw new Error('Result parsing failed');
    }

    const resultRet: resultResponseType = result.data;

    return resultRet;
  },

  //controller for result get All or by Id
  async getQuery(query?: Prisma.ResultWhereInput): Promise<resultResponseArrayType> {
    const ret = await resultService.getQuery(query);

    const result = resultResponseArray.safeParse(transformResultArray(ret));

    if (!result.success) {
      throw new Error('Result parsing failed');
    }

    const resultRet: resultResponseArrayType = result.data;

    return resultRet;
  },

  async getById(id: resultIdType): Promise<resultResponseType> {
    const ret = await resultService.getById(id);

    const result = resultResponse.safeParse(transformResult(ret));

    if (!result.success) {
      throw new Error('Result parsing failed');
    }

    const resultRet: resultResponseType = result.data;

    return resultRet;
  },

  async getWinsLoses(userId: userIdType): Promise<resultWinsLosesType> {
    const ret = await resultService.getWinsLoses(userId);
    console.log(ret);
    return ret;
  },

  async getLeaderboard(): Promise<leaderboardType> {
    return await resultService.getLeaderboard();
  },
};
