import { resultModel } from './result.crud';
import { NotFoundError, ConflictError } from '../../utils/error';
import { Prisma, Result } from '@prisma/client';

import { resultCreateType, resultIdType, leaderboardType } from '../../schemas/result';

import { transformInput } from './result.helper';
import { gameService } from '../game/game.service';
import { tournamentService } from '../tournament/tournament.service';

export const resultService = {
  async create(data: resultCreateType): Promise<Result> {
    const prismaData = await transformInput(data);
    gameService.update(data.gameId);
    tournamentService.update(data.gameId, data.loserId);

    try {
      const ret = await resultModel.insert(prismaData);
      return ret;
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictError(`result already exists`);
      }
      throw err;
    }
  },

  async getQuery(query?: Prisma.ResultWhereInput): Promise<Result[]> {
    //const ret = query
    //  ? await resultModel.findBy(transformQuery(query))
    //  : await resultModel.findAll();
    const ret = query ? await resultModel.findBy(query) : await resultModel.findAll();

    if (ret.length === 0) {
      throw new NotFoundError('No result found');
    }
    return ret;
  },

  async getById(id: resultIdType): Promise<Result> {
    const ret = await resultModel.findById(id);

    if (!ret) throw new NotFoundError(`result with ${id} not found`);

    return ret;
  },

  async getLeaderboard(): Promise<leaderboardType> {
    const ret = await resultModel.getLeaderboard();
    if (ret.length === 0) {
      throw new NotFoundError('No results found');
    }
    return ret;
  },
};
