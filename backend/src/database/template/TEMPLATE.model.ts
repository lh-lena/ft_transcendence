import Database from 'better-sqlite3';
import { ServerContext } from '../../context';
import { createCrud } from '../../utils/crudGenerator';
import { ConflictError } from '../../utils/error';

export const TEMPLATEModel = createCrud( 'TEMPLATE', );

export function findAll(
	context: ServerContext,
) {
	return TEMPLATEModel.findAll( context );
}

export function findById(
	context: ServerContext,
	id: number
) {
	return TEMPLATEModel.findById( context, id );
}

export function insert(
	context: ServerContext,
	data: CreateTEMPLATEInput
) {

       return TEMPLATEModel.insert( context, data );
}

export function patch( 
      context: ServerContext,
      id: number,
      data: PatchTEMPLATEInput
) {
	return TEMPLATEModel.patch( context, id, data );
}

export function del(
        context: ServerContext,
        id: number
) {
	return TEMPLATEModel.del( context, id );
}
