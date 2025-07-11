import { FastifyRequest, FastifyReply } from 'fastify';
import { ServerContext } from '../../context';
import Database from 'better-sqlite3';

import * as matchService from './match.service.ts';

import { userIdBase } from '../../schemas/user';

import { matchIdBase } from '../../schemas/match';

import type {
  matchCreateInput,
  matchUpdateInput,
  userUpdateInput,
  matchQueryInput,
  matchIdInput,
  matchResponseType,
  matchResponseArrayType,
  } from '../../schemas/match';


import * as matchService from './match.service';

export const matchController = { 

  //controller to create an match
  async create(
  	context: ServerContext,
    input: matchCreateInput,
  ) : Promise< matchResponseType > {
  	const newMatch = await matchService.creatematch( context, input );
    return newMatch;
  },
  
  //update match
  async update(
  	context: ServerContext,
    id: matchIdInput | userIdInput,
    input: matchUpdateInput | userUpdateInput,
  ) : Promise< matchResponseType > | undefined {

    let match;
  
    if( matchIdBase.safeParse( { matchId: id } ).success ) {
      console.log( 'inside you match' );
  	  match = await matchService.updatematch( context, id, input );
    }
    else if( userIdBase.safeParse( { userId: id } ).success ) {
      console.log( 'inside you user' );
      match = await matchService.updateuser( context, id, input );
    }

    return match;
  },

  //controller for match get All or by Id
  async getAllorFiltered(
  	context: ServerContext,
    query: matchQueryInput,
  ) : Promise< matchResponseArrayType > | null {
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

  //extra routes
  async setReady(
    context: ServerContext,
    id: userIdInput,
  ) : Promise< matchResponseType | undefined > {
    return await matchService.setReady( context, id );
  },

}
