import { matchMakingClass } from './match.class';
import { userModel } from '../user/user.service';

import { AppError, NotFoundError, ConflictError } from '../../utils/error';

const matchmaker = new matchMakingClass();

export async function getAllorFilteredmatch(
	filters: Record<string, any>
) {

  let match;

	if( !filters ) {
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
	id: matchIdInput,
) {

	const match = matchmaker.findById( id );
	if( !match )
		throw new NotFoundError( `match with ${id} not found` );

	return match;
}

export async function creatematch(
	data: creatematchInput
) {
		return matchmaker.insert( data );
}

export async function updatematch( 
	id: matchIdInput,
	data: matchUpdateInput
) {

	const	match = matchmaker.patchmatch( id, data );

	if( !match )
		throw new NotFoundError( `match with ${id} not found` );

  return match;
}

export async function removematch(
	id: matchIdInput,
) {

	await getmatchById( id );

	matchmaker.remove( id );
	return { message: `match ${id} deleted successfulyy` };
}
