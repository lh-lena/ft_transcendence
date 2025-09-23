import { gameService } from './game.service';

import type { gameCreateType, gameJoinType, gameType, gameIdType } from '../../schemas/game';

export const gameController = {
  async create(data: gameCreateType): Promise<gameType> {
    const ret = await gameService.create(data);
    return ret;
  },

  async join(data: gameJoinType): Promise<gameType> {
    const ret = await gameService.join(data);
    return ret;
  },

  async getById(id: gameIdType): Promise<gameType> {
    const ret = await gameService.getById(id.gameId);
    return ret;
  },

  async deleteOne(id: gameIdType): Promise<{ success: boolean }> {
    await gameService.update(id.gameId);
    return { success: true };
  },
};
