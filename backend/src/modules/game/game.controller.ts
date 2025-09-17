import { gameService } from './game.service';

import type { gameCreateType, gameJoinType, gameType } from '../../schemas/game';

export const gameController = {
  async create(data: gameCreateType): Promise<gameType> {
    const ret = await gameService.create(data);
    return ret;
  },

  async join(data: gameJoinType): Promise<gameType> {
    const ret = await gameService.join(data);
    return ret;
  },

  async getById(id: string): Promise<gameType> {
    const ret = await gameService.getById(id);
    return ret;
  },
};
