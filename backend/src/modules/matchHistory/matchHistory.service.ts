import { createCrud } from '../../utils/prismaCrudGenerator';
import { AppError, NotFoundError, ConflictError } from '../../utils/error';
import { Prisma } from '@prisma/client';

const matchHistoryModel = createCrud( 'matchHistory' );

export async function getQuery(
	filters: Record<string, any>
) {

  let ret;

  console.log( matchHistoryModel.findAll );

	if( Object.keys( filters ).length === 0 ) {
		ret = await matchHistoryModel.findAll();
	} else {
		ret = await matchHistoryModel.findBy( filters );
	}
  if( !ret || ret.length === 0 ) {
    throw new NotFoundError( 'No matchHistory found' );
  }
  return ret;
}

export async function getById(
	id: number
) {

	const ret = await matchHistoryModel.findById( id );
	if( !ret || ret.length === 0 )
		throw new NotFoundError( `matchHistory with ${id} not found` );

	return ret;
}

export async function create(
	data: creatematchHistoryInput
) {

	try { 
		const ret = await matchHistoryModel.insert( data );
    return( ret );
	} catch( err: any ){
    if( err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002' ) {
      throw new ConflictError( `matchHistory already exists` );
    }
		throw err;
	}
}

export async function update( 
	id: number,
	data: patchmatchHistoryInput
) {

	try { 
		const ret = await matchHistoryModel.patch( id, data );
	  if( !ret )
	  	throw new NotFoundError( `matchHistory with ${id} not found` );
    return ret;
	} catch( err: any ) {
    if( err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002' ) {
      throw new ConflictError( `matchHistory already exists` );
    }
      if( err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025' ) {
        throw new NotFoundError( `matchHistory with ${id} not found` );
    }
		throw err;
	}
}

export async function remove(
	id: number
) {
  try {
  	const ret = await matchHistoryModel.remove( id );
    if( !ret )
      throw new NotFoundError( `matchHistory with ${id} not found` );
  	return { message: `matchHistory ${id} deleted successfulyy` };
  } catch( err: any ) {
    if( err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025' ) {
      throw new NotFoundError( `matchHistory with ${id} not found` );
    }
    throw err;
      }
}
