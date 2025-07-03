import Database from 'better-sqlite3';
import { ServerContext } from '../../context';
import { createCrud } from '../../utils/crudGenerator';
import { ConflictError } from '../../utils/error';

export const userModel = createCrud( 'user', );

export function findAll(
	context: ServerContext,
) {
	return userModel.findAll( context );
}

export function findBy(
	context: ServerContext,
	filters: Record<string, any>
) {
	return userModel.findById( context, id );
}

export function findById(
	context: ServerContext,
	id: number
) {
	return userModel.findById( context, id );
}

export function insert(
	context: ServerContext,
	data: CreateuserInput
) {

       return userModel.insert( context, data );
}

export function patch( 
      context: ServerContext,
      id: number,
      data: PatchuserInput
) {
	return userModel.patch( context, id, data );
}

export function remove(
        context: ServerContext,
        id: number
) {
	return userModel.remove( context, id );
}
