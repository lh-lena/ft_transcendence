import { createCrud } from '../../utils/prismaCrudGenerator';

import { AppError, NotFoundError, ConflictError } from '../../utils/error';
import { Prisma } from '@prisma/client';

const resultModel = createCrud( 'result' );
const options = { include: { gamePlayed: { include: { user: true } } } };

async function transformData( data: createresultInput ) {
  const gamePlayed = [];

  if( data.winnerId !== null && data.winnerId !== -1 ) {
    gamePlayed.push( {
      user: { connect: { id: data.winnerId } },
      score: data.scorePlayer1,
      isWinner: true,
      isAi: false,
    });
  } else if ( data.winnerId === -1 ) {
    gamePlayed.push( {
      score: data.scorePlayer1,
      isWinner: true,
      isAi: true,
    });
  }

  if( data.loserId !== null && data.loserId !== -1 ) {
    gamePlayed.push( {
      user: { connect: { id: data.loserId } },
      score: data.scorePlayer2,
      isWinner: false,
      isAi: false,
    });
  } else if ( data.loserId === -1 ) {
    gamePlayed.push( {
      score: data.scorePlayer2,
      isWinner: false,
      isAi: true,
    });
  }

  return {
    gameId: data.gameId,
    status: data.status,
    startedAt: data.startedAt,
    finishedAt: data.finishedAt,
    gamePlayed: { create: gamePlayed }
  };
}

export async function getQuery(
	filters: Record<string, any>
) {

  let ret;

  console.log( options );

	if( Object.keys( filters ).length === 0 ) {
		ret = await resultModel.findAll( options );
  	} else {
		ret = await resultModel.findBy( filters, options );
	}
  if( !ret || ret.length === 0 ) {
    throw new NotFoundError( 'No result found' );
  } 

  return ret;
}

export async function getById(
	id: number
) {

  const ret = await resultModel.findById( id, options );
	if( !ret || ret.length === 0 )
		throw new NotFoundError( `result with ${id} not found` );

	return ret;
}

export async function create(
	data: createresultInput
) {

  const prismaData = await transformData( data );
  let ret;

	try { 
		ret = await resultModel.insert( prismaData );
    ret = await getById( ret.id );
    return( ret );
	} catch( err: any ){
    if( err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002' ) {
      throw new ConflictError( `result already exists` );
    }
		throw err;
	}
}
