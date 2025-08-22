import * as gameService from './game.service';

import type {
  gameCreateType,
  gameQueryType,
  gameResponseType,
  gameResponseArrayType,
  gameIdType,
} from '../../schemas/game';

export const gameController = {
  //controller to create an game
  async create(input: gameCreateType): Promise<gameResponseType> {
    const ret = await gameService.creategame(input);
    return ret;
  },

  //controller for game get All or by Id
  async getQuery(query?: gameQueryType): Promise<gameResponseArrayType> {
    const ret = await gameService.getQuery(query);
    return ret;
  },

  async getById(id: gameIdType): Promise<gameResponseType> {
    const ret = await gameService.getgameById(id);
    return ret;
  },

  async join(id: gameIdType, input: gameCreateType): Promise<gameResponseType> {
    return await gameService.joingame(id, input);
  },
};
