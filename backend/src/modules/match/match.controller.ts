import { FastifyRequest, FastifyReply } from 'fastify';
import Database from 'better-sqlite3';

import * as matchService from './match.service';

import type {
  matchCreateInput,
  matchUpdateInput,
  matchQueryInput,
  matchIdInput,
  matchResponseType,
  matchResponseArrayType,
  } from '../../schemas/match';

export const matchController = { 

  //controller to create an match
  async create(
    input: matchCreateInput,
  ) : Promise< matchResponseType > {

  	const newMatch = await matchService.creatematch( input );
    return newMatch;
  },
  
  //update match
  async update(
    id: matchIdInput,
    input: matchUpdateInput,
  ) : Promise< matchResponseType > | undefined {

    const match = await matchService.updatematch( id, input );
    return match;
  },

  //controller for match get All or by Id
  async getAllorFiltered(
    query: matchQueryInput,
  ) : Promise< matchResponseArrayType > | null {
    return await matchService.getAllorFilteredmatch( query );
  },
  
  async getById(
    id: matchIdInput,
  ) : Promise< matchResponseType | null > {
  	return await matchService.getmatchById( id );
  },
  
  //delete match
 async remove(
    id: matchIdInput,
  ) : Promise< { message: string } > {
  	await matchService.removematch( id );
    return { message: 'Match deleted' };
  },

  async join(
    id: matchIdInput,
    input: matchCreateInput,
  ) : Promise< matchResponseType | null > {
    return await matchService.joinmatch( id, input );
  }

}
