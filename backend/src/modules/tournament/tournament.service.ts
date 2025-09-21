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
    const existingTournament = await tournamentmaker.getByUser(data.userId);
    console.log(existingTournament);

    if (existingTournament) return existingTournament;

    const ret = await tournamentmaker.findAvailableTournament(data);

    return ret;
  },

  async getById(id: tournamentIdType): Promise<tournamentResponseType> {
    const ret = await tournamentmaker.getById(id);

    if (!ret) throw new NotFoundError(`Tournament with id ${id} not found`);

    return ret;
  },

  async update(id: string, loserId: string): Promise<void> {
    await tournamentmaker.update(id, loserId);
  },
};
