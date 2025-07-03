import server from 'fastify';
import { ServerContext } from '../../context';
import * as TEMPLATEModel from './TEMPLATE.model';
import { AppError, NotFoundError, ConflictError } from '../../utils/error';

export async function checkTEMPLATE(
	context: ServerContext,
	id: number
) {
	const TEMPLATEId = parseInt( id as any, 10 );

	const stmt = context.db.prepare( 'SELECT * FROM TEMPLATE WHERE id = ?' );
	const TEMPLATE = stmt.get( TEMPLATEId );
	
	return TEMPLATE;
}

export async function getAllorFiltered(
	context: ServerContext,
	filters: Record<string, any>
) {
	if( Object.keys( filters ).length === 0 ) {
		return TEMPLATEModel.findAll( context );
	} else {
		return UserModel.findFiltered( context, filters );
	}
}

export async function getTEMPLATEById(
	context: ServerContext,
	id: number
) {
	const TEMPLATE = await checkTEMPLATE( context, id );
	if( !TEMPLATE )
		throw new NotFoundError( `TEMPLATE with ${id} not found` );

	return TEMPLATEModel.findById( context, id );
}

//TODO add hashing check logic eg. duplicate emails and min characters etc
//
export async function createTEMPLATE(
	context: ServerContext,
	data: createTEMPLATEInput
) {
	//TODO 

	try{ 
		return TEMPLATEModel.insert( context, data );
	} catch( err: any ){
		throw err;
	}
}

export async function updateTEMPLATE( 
	context: ServerContext,
	id: number,
	data: patchTEMPLATEInput
) {
	const TEMPLATE = await checkTEMPLATE( context, id );
	if( !TEMPLATE )
		throw new NotFoundError( `TEMPLATE with ${id} not found` );

	try{ 
		return TEMPLATEModel.patch( context, id, data );
	} catch( err: any ) {
		throw err;
	}
}

export async function removeTEMPLATE(
	context: ServerContext,
	id: number
) {
	const TEMPLATE = await checkTEMPLATE( context, id );
	if( !TEMPLATE )
		throw new NotFoundError( `TEMPLATE with ${id} not found` );

	TEMPLATEModel.remove( context, id );
	return { message: `TEMPLATE ${id} deleted successfulyy` };
}
