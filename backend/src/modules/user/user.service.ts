import * as userModel from './user.model';
import { AppError, NotFoundError, ConflictError } from '../../utils/error';
import { isSQLConstrait } from '../../utils/sql';

export async function getAllorFiltereduser(
	filters: Record<string, any>
) {

  let user;

	if( Object.keys( filters ).length === 0 ) {
		user = userModel.findAll();
	} else {
		user = userModel.findFiltered( filters );
	}
  if( !user || user.length === 0 ) {
    throw new NotFoundError( 'No users found' );
  }
  return user;
}

export async function getuserById(
	id: number
) {

	const user = userModel.findById( id );
	if( !user )
		throw new NotFoundError( `user with ${id} not found` );

	return user;
}

export async function createuser(
	data: createuserInput
) {

	try{ 
		const user = userModel.insert( data );
    console.log( user );
    return( user );
	} catch( err: any ){
    if( isSQLConstrait( err ) ) {
      throw new ConflictError( `user already exists` );
    }
		throw err;
	}
}

export async function updateuser( 
	id: number,
	data: patchuserInput
) {

	let user;

	try{ 
		user = userModel.patch( id, data );
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
	id: number
) {
	userModel.remove( id );
	return { message: `user ${id} deleted successfulyy` };
}
