import { matchHistoryMakingClass } from './matchHistory.class';
import { userModel } from '../user/user.service';

import { AppError, NotFoundError, ConflictError } from '../../utils/error';

const matchHistorymaker = new matchHistoryMakingClass();

export async function getAllorFilteredmatchHistory(
	filters: Record<string, any>
) {

  let matchHistory;

	if( !filters ) {
		matchHistory = matchHistorymaker.findAll( );
	} else {
		matchHistory = matchHistorymaker.findFiltered( filters );
	}
  if( !matchHistory || matchHistory.length === 0 ) {
    throw new NotFoundError( 'No matchHistorys found' );
  }
  return matchHistory;
}

export async function getmatchHistoryById(
	id: matchHistoryIdInput,
) {

	const matchHistory = matchHistorymaker.findById( id );
	if( !matchHistory )
		throw new NotFoundError( `matchHistory with ${id} not found` );

	return matchHistory;
}

export async function creatematchHistory(
	data: matchHistoryCreateInput
) {
		return matchHistorymaker.insert( data );
}

export async function updatematchHistory( 
	id: matchHistoryIdInput,
	data: matchHistoryUpdateInput
) {

	const	matchHistory = matchHistorymaker.patchmatchHistory( id, data );

	if( !matchHistory )
		throw new NotFoundError( `matchHistory with ${id} not found` );

  return matchHistory;
}

export async function removematchHistory(
	id: matchHistoryIdInput,
) {

	await getmatchHistoryById( id );

	matchHistorymaker.remove( id );
	return { message: `matchHistory ${id} deleted successfulyy` };
}

export async function joinmatchHistory(
  id: matchHistoryIdInput,
  input: matchHistoryCreateInput,
) {
   await getmatchHistoryById( id );

   const matchHistory = matchHistorymaker.join( id, input );
   if( !matchHistory )
    throw new NotFoundError( `matchHistory with ${id} not found` );
  return matchHistory;
}
