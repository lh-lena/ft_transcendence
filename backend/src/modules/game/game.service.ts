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

  async create(data: gameJoinType): Promise<gameType> {
    const existingGame = await gamemaker.getByUser(data.playerId);
    if (existingGame) return existingGame;

    let game;
    if (data.gameId) {
      game = await gamemaker.getById(data.gameId);
      if (!game) throw new NotFoundError(`game ${data.gameId} not found`);
      await gamemaker.join(game, data.playerId);
    } else if (data.mode === 'pvp_remote' && data.visibility === 'public') {
      game = gamemaker.findAvailableGame(data.playerId);
    } else {
      game = await gamemaker.create(data as gameCreateType);
      await gamemaker.join(game, data.playerId);
    }
    return game;
  },

  async createTournamentGame(player1: number, player2: number): Promise<gameType> {
    const game = await gamemaker.create({ mode: 'pvp_remote', visibility: 'public' });
    await gamemaker.join(game, player1);
    await gamemaker.join(game, player2);
    return game;
  },

  async update(id: string): Promise<void> {
    if (await gamemaker.getById(id)) gamemaker.remove(id);
  },
};
