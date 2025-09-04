import { gameService } from './game.service';

import type { gameJoinType, gameType } from '../../schemas/game';

export const gameController = {
  async create(data: gameJoinType): Promise<gameType> {
    const ret = await gameService.create(data);
    return ret;
  },

  async getById(id: string): Promise<gameType> {
    const ret = await gameService.getById(id);
    return ret;
  },
};
