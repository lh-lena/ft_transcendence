import server from 'fastify';
import { ServerContext } from '../../context';
import * as UserModel from './user.model';
import { AppError, NotFoundError, ConflictError } from '../../utils/error';

export async function checkUser(
	context: ServerContext,
	id: number
) {
	const userId = parseInt( id as any, 10 );

	const stmt = context.db.prepare( 'SELECT * FROM users WHERE id = ?' );
	const user = stmt.get( userId );
	
	return user;
}

export async function getAllUsers(
	context: ServerContext,
) {
	return UserModel.findAll( context );
}

export async function getUserById(
	context: ServerContext,
	id: number
) {
	const user = await checkUser( context, id );
	if( !user )
		throw new NotFoundError( `User with ${id} not found` );

	return UserModel.findById( context, id );
}

//TODO add hashing check logic eg. duplicate emails and min characters etc
//
export async function createUser(
	context: ServerContext,
	data: createUserInput
) {
	//TODO 

	try{ 
		return UserModel.insert( context, data );
	} catch( err: any ){
		throw err;
	}
}

export async function updateUser( 
	context: ServerContext,
	id: number,
	data: patchUserInput
) {
	const user = await checkUser( context, id );
	if( !user )
		throw new NotFoundError( `User with ${id} not found` );

	try{ 
		return UserModel.patch( context, id, data );
	} catch( err: any ) {
		throw err;
	}
}

export async function deleteUser(
	context: ServerContext,
	id: number
) {
	const user = await checkUser( context, id );
	if( !user )
		throw new NotFoundError( `User with ${id} not found` );

	UserModel.del( context, id );
	return { message: `User ${id} deleted successfulyy` };
}
