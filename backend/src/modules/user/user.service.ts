import { ServerContext } from '../../context';
import * as userModel from './user.model';
import { AppError, NotFoundError, ConflictError } from '../../utils/error';
import { isSQLConstrait } from '../../utils/sql';

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

  let user;

	if( Object.keys( filters ).length === 0 ) {
		user = userModel.findAll( context );
	} else {
		user = userModel.findFiltered( context, filters );
	}
  if( !user || user.length === 0 ) {
    throw new NotFoundError( 'No users found' );
  }
  return user;
}

export async function getuserById(
	context: ServerContext,
	id: number
) {

	const user = userModel.findById( context, id );
	if( !user )
		throw new NotFoundError( `user with ${id} not found` );

	return user;
}

export async function createuser(
	context: ServerContext,
	data: createuserInput
) {

	try{ 
		return userModel.insert( context, data );
	} catch( err: any ){
    if( isSQLConstrait( err ) ) {
      throw new ConflictError( `user already exists` );
    }
		throw err;
	}
}

export async function updateuser( 
	context: ServerContext,
	id: number,
	data: patchuserInput
) {

	let user;

	try{ 
		user = userModel.patch( context, id, data );
	} catch( err: any ) {
    if( isSQLConstrait( err ) ) {
      throw new ConflictError( `user already exists` );
    }
		throw err;
	}
	if( !user )
		throw new NotFoundError( `user with ${id} not found` );
  return user;
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
