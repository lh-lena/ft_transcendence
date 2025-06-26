import server from 'fastify';
import { ServerContext } from '../../context';
import * as UserModel from './user.model';
import { NotFoundError, DatabaseError, ConflictError } from '../../errors';

export async function getAllUsers(
	context: ServerContext,
) {
	try{
		return UserModel.findAll( context );
	} catch( err ) {
		throw new DatabaseError( 'Failed to retries users' );
	}
}

export async function getUserById(
	context: ServerContext,
	id: number
) {
	try{
		return UserModel.findById( context, id );
	} catch( err ){
		if( err instanceof NotFoundError )
			throw err;
		throw new DatabaseError( 'Failed to retriev user' );
	}
}

//TODO add hashing here and some check logic here eg. doubles ??
export async function createUser(
	context: ServerContext,
	data: createUserInput
) {
	try{
		return UserModel.insert( context, data );
	} catch( err: any ){
		if( err.code == 'SQLITE_CONSTRAINT' )
			throw new ConflitctError( 'Email already in use' );
		throw new DatabaseError( 'Failed to create User' );
	}
}

export async function updateUser( 
	context: ServerContext,
	id: Number,
	data: patchUserInput
) {
	try{
		return UserModel.patch( context, id, data );
	} catch( err ){
		if( err instanceof NotFoundError )
			throw err;
		throw new DatabaseError( 'Failed to update User' );
	}
}

export async function deleteUser(
	context: ServerContext,
	id: number
) {
	try{
		return UserModel.del( context, id );
	} catch( err ){
		if( err instanceof NotFoundError ) 
			throw err;
		throw new DatabaseError( 'Failed to delete User' );
	}
}
