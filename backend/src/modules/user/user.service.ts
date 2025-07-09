import server from 'fastify';
import { ServerContext } from '../../context';
import * as userModel from './user.model';
import { AppError, NotFoundError, ConflictError } from '../../utils/error';

export async function checkuser(
	context: ServerContext,
	id: number
) {
	const stmt = context.db.prepare( 'SELECT * FROM user WHERE id = ?' );
	const user = stmt.get( id );
	
	return user;
}

export async function getAllorFiltereduser(
	context: ServerContext,
	filters: Record<string, any>
) {
	if( Object.keys( filters ).length === 0 ) {
		return userModel.findAll( context );
	} else {
		return userModel.findFiltered( context, filters );
	}
}

export async function getuserById(
	context: ServerContext,
	id: number
) {
	const user = await checkuser( context, id );
	if( !user )
		throw new NotFoundError( `user with ${id} not found` );

	return userModel.findById( context, id );
}

//TODO add hashing check logic eg. duplicate emails and min characters etc
//
export async function createuser(
	context: ServerContext,
	data: createuserInput
) {
	//TODO 

	try{ 
		return userModel.insert( context, data );
	} catch( err: any ){
		throw err;
	}
}

export async function updateuser( 
	context: ServerContext,
	id: number,
	data: patchuserInput
) {
	const user = await checkuser( context, id );
	if( !user )
		throw new NotFoundError( `user with ${id} not found` );

	try{ 
		return userModel.patch( context, id, data );
	} catch( err: any ) {
		throw err;
	}
}

export async function removeuser(
	context: ServerContext,
	id: number
) {
	const user = await checkuser( context, id );
	if( !user )
		throw new NotFoundError( `user with ${id} not found` );

	userModel.remove( context, id );
	return { message: `user ${id} deleted successfulyy` };
}
