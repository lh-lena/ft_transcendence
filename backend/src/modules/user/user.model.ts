import { createCrud } from '../../utils/prismaCrudGenerator';

import { ConflictError } from '../../utils/error';

export const userModel = createCrud( 'user' );

export function findAll() {
	return userModel.findAll();
}

export function findFiltered(
	filters: Record<string, any>
) {
	return userModel.findBy( filters );
}

export function findById(
	id: number
) {
	return userModel.findById( id );
}

export function insert(
	data: CreateuserInput
) {
  return userModel.insert( data );
}

export function patch( 
      id: number,
      data: PatchuserInput
) {
	return userModel.patch( id, data );
}

export function remove(
        id: number
) {
	return userModel.remove( id );
}
