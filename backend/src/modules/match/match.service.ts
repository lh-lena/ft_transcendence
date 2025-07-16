import { ServerContext } from '../../context';
import { matchMakingClass } from './match.class';

import { AppError, NotFoundError, ConflictError } from '../../utils/error';

const matchmaker = new matchMakingClass();

export async function getAllorFilteredmatch(
	context: ServerContext,
	filters: Record<string, any>
) {

  let match;

	if( Object.keys( filters ).length === 0 ) {
		match = matchmaker.findAll( );
	} else {
		match = matchmaker.findFiltered( filters );
	}
  if( !match || match.length === 0 ) {
    throw new NotFoundError( 'No matchs found' );
  }
  return match;
}

export async function getmatchById(
	context: ServerContext,
	id: matchIdInput,
) {

	const match = matchmaker.findById( id );
	if( !match )
		throw new NotFoundError( `match with ${id} not found` );

	return match;
}

export async function creatematch(
	context: ServerContext,
	data: creatematchInput
) {
		return matchmaker.insert( data );
}

export async function updatematch( 
	context: ServerContext,
	id: matchIdInput,
	data: matchUpdateInput
) {

	const	match = matchmaker.patchmatch( id, data );

	if( !match )
		throw new NotFoundError( `match with ${id} not found` );

  return match;
}

export async function updateuser( 
	context: ServerContext,
	id: userIdInput,
	data: userUpdateInput
) {

	const	match = matchmaker.patchuser( id, data );

  console.log( 'user updated match:', match );
	if( !match )
		throw new NotFoundError( `user with ${id} not found in match` );

  return match;
}

export async function removematch(
	context: ServerContext,
	id: matchIdInput,
) {

	await getmatchById( context, id );

	matchmaker.remove( id );
	return { message: `match ${id} deleted successfulyy` };
}
