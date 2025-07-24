import { FastifyRequest, FastifyReply } from 'fastify';
import Database from 'better-sqlite3';

import type {
  userCreateInput,
  userUpdateInput,
  userQueryInput,
  userIdInput,
  userResponseType,
  userResponseArrayType,
  } from '../../schemas/user';

import * as userService from './user.service';

export const userController = { 

  //controller to create an user
  async create(
    input: userCreateInput,
  ) : Promise< userResponseType > {
  	const ret = await userService.create( input );
    return ret;
  },
  
  //update user
  async update(
    id: userIdInput,
    input: userUpdateInput,
  ) : Promise< userResponseType > {
  	const ret = await userService.update( id, input );
    return ret;
  },

  //controller for user get All or by Id
  async getAllorFiltered(
    query: userQueryInput,
  ) : Promise< userResponseArrayType > {
    const ret = await userService.getQuery( query );
    return ret;
  },
  
  async getById(
    id: userIdInput,
  ) : Promise< userResponseType | null > {
  	const ret = await userService.getById( id );
    return ret;
  },
  
  //delete user
 async remove(
    id: userIdInput,
  ) : Promise< { message: string } > {
  	const ret = await userService.remove( id );
    return ret;
  },
}
