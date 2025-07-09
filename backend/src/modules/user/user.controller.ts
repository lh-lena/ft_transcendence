import { FastifyRequest, FastifyReply } from 'fastify';
import { ServerContext } from '../../context';
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
  	context: ServerContext,
    input: userCreateInput,
  ) : Promise< userResponseType > {
  	const newUser = await userService.createuser( context, input );
    return newUser;
  },
  
  //update user
  async update(
  	context: ServerContext,
    id: userIdInput,
    input: userUpdateInput,
  ) : Promise< userResponseType > {
  	const upUser = await userService.updateuser( context, id, input );
    return upUser;
  },

  //controller for user get All or by Id
  async getAllorFiltered(
  	context: ServerContext,
    query: userQueryInput,
  ) : Promise< userResponseArrayType > {
    return await userService.getAllorFiltereduser( context, query );
  },
  
  async getById(
  	context: ServerContext,
    id: userIdInput,
  ) : Promise< userResponseType | null > {
  	return await userService.getuserById( context, id );
  },
  
  //delete user
 async remove(
  	context: ServerContext,
    id: userIdInput,
  ) : Promise< { message: string } > {
  	await userService.removeuser( context, id );
    return { message: 'User deleted' };
  },
}
