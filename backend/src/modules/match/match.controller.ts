import { FastifyRequest, FastifyReply } from 'fastify';
import { ServerContext } from '../../context';
import Database from 'better-sqlite3';

import type {
  matchCreateInput,
  matchUpdateInput,
  matchQueryInput,
  matchIdInput,
  matchResponseType,
  matchResponseArrayType,
  } from '../../schemas/match';

  import type {
    userIdInput,
  } from '../../schemas/user';

import * as matchService from './match.service';

export const matchController = { 

  //controller to create an match
  async create(
  	context: ServerContext,
    input: matchCreateInput,
  ) : Promise< matchResponseType > {
  	const newMatch = await matchService.registerMatch( context, input );
    return newMatch;
  },
  
  //update match
  async update(
  	context: ServerContext,
    id: userIdInput,
    input: matchUpdateInput,
  ) : Promise< matchResponseType > {
  	return await matchService.updateStatus( context, id, input );
  },

  //controller for match get All or by Id
  async getAllorFiltered(
  	context: ServerContext,
    query: matchQueryInput,
  ) : Promise< matchResponseArrayType > {
    return await matchService.getAllorFilteredmatch( context, query );
  },
  
  async getById(
  	context: ServerContext,
    id: matchIdInput,
  ) : Promise< matchResponseType | null > {
  	return await matchService.getmatchById( context, id );
  },
  
  //delete match
 async remove(
  	context: ServerContext,
    id: matchIdInput,
  ) : Promise< { message: string } > {
  	await matchService.removematch( context, id );
    return { message: 'Match deleted' };
  },
}
