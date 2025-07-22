import { createCrud } from '../../utils/prismaCrudGenerator';
import { AppError, NotFoundError, ConflictError } from '../../utils/error';
import { Prisma } from '@prisma/client';

const userModel = createCrud( 'user' );

export async function getAllorFiltereduser(
	filters: Record<string, any>
) {

  let user;

	if( Object.keys( filters ).length === 0 ) {
		user = await userModel.findAll();
	} else {
		user = await userModel.findBy( filters );
	}
  if( !user || user.length === 0 ) {
    throw new NotFoundError( 'No users found' );
  }
  return user;
}

export async function getuserById(
	id: number
) {

	const user = await userModel.findById( id );
	if( !user || user.length === 0 )
		throw new NotFoundError( `user with ${id} not found` );

	return user;
}

export async function createuser(
	data: createuserInput
) {

	try { 
		const user = await userModel.insert( data );
    return( user );
	} catch( err: any ){
    if( err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002' ) {
      throw new ConflictError( `user already exists` );
    }
		throw err;
	}
}

export async function updateuser( 
	id: number,
	data: patchuserInput
) {

	try { 
		const user = await userModel.patch( id, data );
	  if( !user )
	  	throw new NotFoundError( `user with ${id} not found` );
    return user;
	} catch( err: any ) {
    if( err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002' ) {
      throw new ConflictError( `user already exists` );
    }
      if( err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025' ) {
        throw new NotFoundError( `user with ${id} not found` );
    }
		throw err;
	}
}

export async function removeuser(
	id: number
) {
  try {
  	const user = await userModel.remove( id );
    if( !user )
      throw new NotFoundError( `user with ${id} not found` );
  	return { message: `user ${id} deleted successfulyy` };
  } catch( err: any ) {
    if( err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025' ) {
      throw new NotFoundError( `user with ${id} not found` );
    }
    throw err;
      }
}
