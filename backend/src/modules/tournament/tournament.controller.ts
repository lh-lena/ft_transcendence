import type {} from '../../schemas/tournament';

import * as tournamentService from './tournament.service';

export const tournamentController = {
  //controller to create an tournament
  async create(input: tournamentCreateInput): Promise<tournamentResponseType> {
    const ret = await tournamentService.create(input);
    return ret;
  },

  //update tournament
  async update(
    id: tournamentIdInput,
    input: tournamentUpdateInput,
  ): Promise<tournamentResponseType> {
    const ret = await tournamentService.update(id, input);
    return ret;
  },

  //controller for tournament get All or by Id
  async getAllorFiltered(
    query: tournamentQueryInput,
  ): Promise<tournamentResponseArrayType> {
    const ret = await tournamentService.getQuery(query);
    return ret;
  },

  async getById(id: tournamentIdInput): Promise<tournamentResponseType | null> {
    const ret = await tournamentService.getById(id);
    return ret;
  },

  //delete tournament
  async deleteOne(id: tournamentIdInput): Promise<{ message: string }> {
    const ret = await tournamentService.deleteOne(id);
    return ret;
  },
};
