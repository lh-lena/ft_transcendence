import { tournamentService } from './tournament.service';

import type { tournamentCreateType, tournamentResponseType } from '../../schemas/tournament';

export const tournamentController = {
  //join player to tournament
  async create(input: tournamentCreateType): Promise<tournamentResponseType> {
    const ret = await tournamentService.create(input);
    return ret;
  },

  //get tournament by id
  async getById(id: string): Promise<tournamentResponseType> {
    const ret = await tournamentService.getById(id);
    return ret;
  },
};
