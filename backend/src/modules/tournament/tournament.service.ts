import { tournamentClass } from './tournament.class';
import { NotFoundError } from '../../utils/error';

import type { tournamentCreateType, tournamentResponseType } from '../../schemas/tournament';

const tournamentmaker = new tournamentClass();

export const tournamentService = {
  async create(data: tournamentCreateType): Promise<tournamentResponseType> {
    const ret = await tournamentmaker.findAvailableTournament(data);
    return ret;
  },

  async getById(id: string): Promise<tournamentResponseType> {
    const ret = await tournamentmaker.getById(id);

    if (!ret) throw new NotFoundError(`Tournament with id ${id} not found`);

    return ret;
  },

  async update(id: string, loserId: string): Promise<void> {
    if (await this.getById(id)) await tournamentmaker.update(id, loserId);
  },
};
