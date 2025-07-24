import { FastifyRequest, FastifyReply } from 'fastify';
import Database from 'better-sqlite3';

import type {
  } from '../../schemas/result';

import * as resultService from './result.service';

export const resultController = { 

  //controller to create an result
  async create(
    input: resultCreateInput,
  ) : Promise< resultResponseType > {
  	const ret = await resultService.create( input );
    return ret ;
  },
  
  //update result
  async update(
    id: resultIdInput,
    input: resultUpdateInput,
  ) : Promise< resultResponseType > {
  	const ret = await resultService.update( id, input );
    return ret;
  },

  //controller for result get All or by Id
  async getAllorFiltered(
    query: resultQueryInput,
  ) : Promise< resultResponseArrayType > {
    const ret = await resultService.getQuery( query );
    return ret;
  },
  
  async getById(
    id: resultIdInput,
  ) : Promise< resultResponseType | null > {
  	const ret = await resultService.getById( id );
    return ret;
  },
  
  //delete result
 async remove(
    id: resultIdInput,
  ) : Promise< { message: string } > {
  	const ret = await resultService.remove( id );
    return ret;
  },
}
