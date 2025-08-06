import * as gameService from './game.service';

import type {
  gameCreateInput,
  gameQueryInput,
  gameResponseType,
  gameResponseArrayType,
  gameIdInput,
} from '../../schemas/game';

export const gameController = {
  //controller to create an game
  async create(input: gameCreateInput): Promise<gameResponseType> {
    const ret = await gameService.creategame(input);
    return ret;
  },

  //controller for game get All or by Id
  async getAllorFiltered(
    query: gameQueryInput,
  ): Promise<gameResponseArrayType> {
    const ret = await gameService.getAllorFilteredgame(query);
    return ret;
  },

  async getById(id: gameIdInput): Promise<gameResponseType> {
    const ret = await gameService.getgameById(id);
    return ret;
  },

  async join(
    id: gameIdInput,
    input: gameCreateInput,
  ): Promise<gameResponseType> {
    return await gameService.joingame(id, input);
  },
};
