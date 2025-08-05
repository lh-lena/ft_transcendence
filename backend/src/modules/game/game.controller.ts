import * as gameService from './game.service';

import type {
  gameCreateInput,
  gameQueryInput,
  gameResponseType,
  gameResponseArrayType,
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
  ): Promise<gameResponseArrayType | null> {
    const ret = await gameService.getAllorFilteredgame(query);
    return ret;
  },

  async getById(id: string): Promise<gameResponseType | null> {
    const ret = await gameService.getgameById(id);
    return ret;
  },

  async join(
    id: string,
    input: gameCreateInput,
  ): Promise<gameResponseType | null> {
    return await gameService.joingame(id, input);
  },
};

//unused
//update game
//  async update(
//    id: string,
//    input: gameUpdateInput,
//  ): Promise<gameResponseType | undefined> {
//    const ret = await gameService.updategame(id, input);
//    return ret;
//  },
//delete game
//  async deleteOne(id: string): Promise<{ message: string }> {
//    const ret = gameService.deleteOnegame(id);
//    return ret;
//    return { message: 'Match deleted' };
//  },
