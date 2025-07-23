import { createCrud } from '../../utils/prismaCrudGenerator';
import { AppError, NotFoundError, ConflictError } from '../../utils/error';
import { Prisma } from '@prisma/client';

const userModel = createCrud( 'user' );

export async function getQuery(
	filters: Record<string, any>
) {

  let ret;

	if( Object.keys( filters ).length === 0 ) {
		ret = await userModel.findAll();
	} else {
		ret = await userModel.findBy( filters );
	}
  if( !ret || ret.length === 0 ) {
    throw new NotFoundError( 'No user found' );
  }
  return ret;
}

export async function getById(
	id: number
) {

	const ret = await userModel.findById( id );
  console.log( "USERID: ", Number( id ), "USER: ", ret );
	if( !ret || ret.length === 0 )
		throw new NotFoundError( `user with ${id} not found` );

	return ret;
}

export async function create(
	data: createuserInput
) {

	try { 
		const ret = await userModel.insert( data );
    return( ret );
	} catch( err: any ){
    if( err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002' ) {
      throw new ConflictError( `user already exists` );
    }
		throw err;
	}
}

export async function update( 
	id: number,
	data: patchuserInput
) {

	try { 
		const ret = await userModel.patch( id, data );
	  if( !ret )
	  	throw new NotFoundError( `user with ${id} not found` );
    return ret;
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

export async function remove(
	id: number
) {
  try {
  	const ret = await userModel.remove( id );
    if( !ret )
      throw new NotFoundError( `user with ${id} not found` );
  	return { message: `user ${id} deleted successfulyy` };
  } catch( err: any ) {
    if( err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025' ) {
      throw new NotFoundError( `user with ${id} not found` );
    }
    throw err;
      }
}
