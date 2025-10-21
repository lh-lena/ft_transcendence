import { tournamentClass } from './tournament.class';
import { NotFoundError } from '../../utils/error';

import type {
  tournamentCreateType,
  tournamentIdType,
  tournamentResponseType,
} from '../../schemas/tournament';

const tournamentmaker = new tournamentClass();

export const tournamentService = {
  async create(data: tournamentCreateType): Promise<tournamentResponseType> {
    await tournamentmaker.leave(data.userId);

    const ret = await tournamentmaker.findAvailableTournament(data);
    console.log(ret);

    return ret;
  },

  async getById(id: tournamentIdType): Promise<tournamentResponseType> {
    const ret = await tournamentmaker.getById(id);

    if (!ret) throw new NotFoundError(`Tournament with id: ${id.tournamentId} not found`);

    return ret;
  },

  async update(id: string, loserId: string): Promise<void> {
    await tournamentmaker.update(id, loserId);
  },

  async leave(userId: string): Promise<boolean> {
    return tournamentmaker.leave(userId);
  },
};
