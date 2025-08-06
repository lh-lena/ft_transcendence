import type {} from '../../schemas/result';

import * as resultService from './result.service';

import {
  resultCreateInput,
  resultQueryInput,
  resultIdInput,
  resultResponseType,
  resultResponseArrayType,
} from '../../schemas/result';

export const resultController = {
  //controller to create an result
  async create(input: resultCreateInput): Promise<resultResponseType> {
    const ret = await resultService.create(input);
    return ret;
  },

  //controller for result get All or by Id
  async getAllorFiltered(
    query: resultQueryInput,
  ): Promise<resultResponseArrayType> {
    const ret = await resultService.getAllorFiltered(query);
    return ret;
  },

  async getById(id: resultIdInput): Promise<resultResponseType> {
    const ret = await resultService.getById(id);
    return ret;
  },
};
