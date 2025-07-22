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
  	const newUser = await userService.create( input );
    return newUser;
  },
  
  //update user
  async update(
    id: userIdInput,
    input: userUpdateInput,
  ) : Promise< userResponseType > {
  	return await userService.update( id, input );
  },

  //controller for user get All or by Id
  async getAllorFiltered(
    query: userQueryInput,
  ) : Promise< userResponseArrayType > {
    return await userService.getQuery( query );
  },
  
  async getById(
    id: userIdInput,
  ) : Promise< userResponseType | null > {
  	return await userService.getById( id );
  },
  
  //delete user
 async remove(
    id: userIdInput,
  ) : Promise< { message: string } > {
  	return await userService.remove( id );
  },
}
