import server from 'fastify';
import { ServerContext } from '../../context';
import * as UserModel from './user.model';

export async function getAllUsers(
	context: ServerContext,
) {
	return UserModel.findAll( context );
}

export async function getUserById(
	context: ServerContext,
	id: number
) {
	return UserModel.findById( context, id );
}

//TODO add hashing here and some check logic here eg. doubles ??
export async function createUser(
	context: ServerContext,
	data: createUserInput
) {
	return UserModel.insert( context, data );
}

export async function updateUser( 
	context: ServerContext,
	id: Number,
	data: patchUserInput
) {
	return UserModel.patch( context, id, data );
}

export async function deleteUser(
	context: ServerContext,
	id: number
) {
	return UserModel.del( context, id );
}
