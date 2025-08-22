import * as tournamentService from './tournament.service';

import type {
  tournamentIdType,
  tournamentCreateType,
  tournamentResponseType,
} from '../../schemas/tournament';

export const tournamentController = {
  //join player to tournament
  async create(input: tournamentCreateType): Promise<tournamentResponseType> {
    const ret = await tournamentService.create(input);
    return ret;
  },

  //get tournament by id
  async getById(id: tournamentIdType): Promise<tournamentResponseType> {
    const ret = await tournamentService.getById(id);
    return ret;
  },

  async deleteOne(id: tournamentIdType): Promise<{ success: boolean }> {
    await tournamentService.deleteOne(id);
    return { success: true };
  },
};
