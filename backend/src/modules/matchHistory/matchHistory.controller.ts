import { FastifyRequest, FastifyReply } from 'fastify';
import Database from 'better-sqlite3';

import * as matchHistoryService from './matchHistory.service';

import type {
  } from '../../schemas/match';

export const matchHistoryController = { 

  //controller to create an matchHistory
  async create(
    input: matchHistoryCreateInput,
  ) : Promise< matchHistoryResponseType > {

  	const newMatch = await matchHistoryService.creatematchHistory( input );
    return newMatch;
  },
  
  //update matchHistory
  async update(
    id: matchHistoryIdInput,
    input: matchHistoryUpdateInput,
  ) : Promise< matchHistoryResponseType > | undefined {

    const matchHistory = await matchHistoryService.updatematchHistory( id, input );
    return matchHistory;
  },

  //controller for matchHistory get All or by Id
  async getAllorFiltered(
    query: matchHistoryQueryInput,
  ) : Promise< matchHistoryResponseArrayType > | null {
    return await matchHistoryService.getAllorFilteredmatchHistory( query );
  },
  
  async getById(
    id: matchHistoryIdInput,
  ) : Promise< matchHistoryResponseType | null > {
  	return await matchHistoryService.getmatchHistoryById( id );
  },
  
  //delete matchHistory
 async remove(
    id: matchHistoryIdInput,
  ) : Promise< { message: string } > {
  	await matchHistoryService.removematchHistory( id );
    return { message: 'Match deleted' };
  },
}
