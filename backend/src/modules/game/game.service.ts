import { gameClass } from './game.class';
import { NotFoundError } from '../../utils/error';

import type { gameType, gameJoinType, gameCreateType } from '../../schemas/game';

const gamemaker = new gameClass();

export const gameService = {
  async getById(id: string): Promise<gameType> {
    const game = await gamemaker.getById(id);
    if (!game) throw new NotFoundError(`game ${id} not found`);

    return game;
  },

  async create(data: gameCreateType): Promise<gameType> {
    let game = await gamemaker.create(data as gameCreateType);

    game = await gamemaker.join(game, data.playerId);

    return game;
  },

  async join(data: gameJoinType): Promise<gameType> {
    if (data.gameId) {
      let game = await this.getById(data.gameId);
      game = await gamemaker.join(game, data.playerId);
      return game;
    }
    const game = await gamemaker.findAvailableGame(data.playerId);
    return game;
  },

  async createTournamentGame(player1: string, player2: string): Promise<gameType> {
    const game = await gamemaker.create({
      mode: 'pvp_remote',
      visibility: 'private',
      playerId: player1,
    });
    await gamemaker.join(game, player2);
    return game;
  },

  async update(id: string): Promise<void> {
    if (await gamemaker.getById(id)) gamemaker.remove(id);
  },
};
