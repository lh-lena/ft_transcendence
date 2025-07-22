import { createCrud } from '../../utils/prismaCrudGenerator';
import { AppError, NotFoundError, ConflictError } from '../../utils/error';
import { Prisma } from '@prisma/client';

const TMPModel = createCrud( 'TMP' );

export async function getQuery(
	filters: Record<string, any>
) {

  let ret;

	if( Object.keys( filters ).length === 0 ) {
		ret = await TMPModel.findAll();
	} else {
		ret = await TMPModel.findBy( filters );
	}
  if( !ret || ret.length === 0 ) {
    throw new NotFoundError( 'No TMP found' );
  }
  return ret;
}

export async function getById(
	id: number
) {

	const ret = await TMPModel.findById( id );
	if( !ret || ret.length === 0 )
		throw new NotFoundError( `TMP with ${id} not found` );

	return ret;
}

export async function create(
	data: createTMPInput
) {

	try { 
		const ret = await TMPModel.insert( data );
    return( ret );
	} catch( err: any ){
    if( err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002' ) {
      throw new ConflictError( `TMP already exists` );
    }
		throw err;
	}
}

export async function update( 
	id: number,
	data: patchTMPInput
) {

	try { 
		const ret = await TMPModel.patch( id, data );
	  if( !ret )
	  	throw new NotFoundError( `TMP with ${id} not found` );
    return ret;
	} catch( err: any ) {
    if( err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002' ) {
      throw new ConflictError( `TMP already exists` );
    }
      if( err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025' ) {
        throw new NotFoundError( `TMP with ${id} not found` );
    }
		throw err;
	}
}

export async function remove(
	id: number
) {
  try {
  	const ret = await TMPModel.remove( id );
    if( !ret )
      throw new NotFoundError( `TMP with ${id} not found` );
  	return { message: `TMP ${id} deleted successfulyy` };
  } catch( err: any ) {
    if( err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025' ) {
      throw new NotFoundError( `TMP with ${id} not found` );
    }
    throw err;
      }
}
