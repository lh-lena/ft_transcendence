import { tournamentMakingClass } from './tournament.class';
import { NotFoundError } from '../../utils/error';

import type { tournamentCreateType, tournamentResponseType } from '../../schemas/tournament';

const tournamentmaker = new tournamentMakingClass();

export const tournamentService = {
  async create(data: tournamentCreateType): Promise<tournamentResponseType> {
    const ret = await tournamentmaker.join(data);
    return ret;
  },

  async getById(id: number): Promise<tournamentResponseType> {
    const ret = await tournamentmaker.getById(id);

    if (!ret) {
      throw new NotFoundError(`Tournament with id ${id} not found`);
    }

    return ret;
  },

  async deleteOne(id: number): Promise<void> {
    const ret = await tournamentmaker.deleteOne(id);
    if (!ret) throw new NotFoundError(`tournament with ${id} not founf`);
  },
};
