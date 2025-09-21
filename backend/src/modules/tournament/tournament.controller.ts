import { tournamentService } from './tournament.service';

import type {
  tournamentCreateType,
  tournamentIdType,
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

  async leave(id: string): Promise<string> {
    if (await tournamentService.leave(id)) {
      return 'left tournament';
    } else {
      return 'no tournament to leave';
    }
  },
};
