import { FastifyRequest, FastifyReply } from 'fastify';
import Database from 'better-sqlite3';

import type {
  } from '../../schemas/TMP';

import * as TMPService from './TMP.service';

export const TMPController = { 

  //controller to create an TMP
  async create(
    input: TMPCreateInput,
  ) : Promise< TMPResponseType > {
  	const ret = await TMPService.create( input );
    return ret ;
  },
  
  //update TMP
  async update(
    id: TMPIdInput,
    input: TMPUpdateInput,
  ) : Promise< TMPResponseType > {
  	const ret = await TMPService.update( id, input );
    return ret;
  },

  //controller for TMP get All or by Id
  async getAllorFiltered(
    query: TMPQueryInput,
  ) : Promise< TMPResponseArrayType > {
    const ret =  await TMPService.getQuery( query );
    return ret;
  },
  
  async getById(
    id: TMPIdInput,
  ) : Promise< TMPResponseType | null > {
  	const ret = await TMPService.getById( id );
    return ret;
  },
  
  //delete TMP
 async remove(
    id: TMPIdInput,
  ) : Promise< { message: string } > {
  	const ret = await TMPService.remove( id );
    return ret;
  },
}
