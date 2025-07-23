import { FastifyRequest, FastifyReply } from 'fastify';
import Database from 'better-sqlite3';

import * as gameService from './game.service';

import type {
  gameCreateInput,
  gameUpdateInput,
  gameQueryInput,
  gameIdInput,
  gameResponseType,
  gameResponseArrayType,
  } from '../../schemas/game';

export const gameController = { 

  //controller to create an game
  async create(
    input: gameCreateInput,
  ) : Promise< gameResponseType > {

  	const newMatch = await gameService.creategame( input );
    return newMatch;
  },
  
  //update game
  async update(
    id: gameIdInput,
    input: gameUpdateInput,
  ) : Promise< gameResponseType > | undefined {

    const game = await gameService.updategame( id, input );
    return game;
  },

  //controller for game get All or by Id
  async getAllorFiltered(
    query: gameQueryInput,
  ) : Promise< gameResponseArrayType > | null {
    return await gameService.getAllorFilteredgame( query );
  },
  
  async getById(
    id: gameIdInput,
  ) : Promise< gameResponseType | null > {
  	return await gameService.getgameById( id );
  },
  
  //delete game
 async remove(
    id: gameIdInput,
  ) : Promise< { message: string } > {
  	await gameService.removegame( id );
    return { message: 'Match deleted' };
  },

  async join(
    id: gameIdInput,
    input: gameCreateInput,
  ) : Promise< gameResponseType | null > {
    return await gameService.joingame( id, input );
  }

}
