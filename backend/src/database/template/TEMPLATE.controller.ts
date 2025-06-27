import { FastifyRequest, FastifyReply } from 'fastify';
import { ServerContext } from '../../context';
import Database from 'better-sqlite3';

import { CreateTEMPLATESchema, UpdateTEMPLATESchema } from './TEMPLATE.schema';
import * as TEMPLATEService from './TEMPLATE.service';

//controller for TEMPLATE get All or by Id
export async function getAllTEMPLATE(
	context: ServerContext,
	req: FastifyRequest,
	reply: FastifyReply 
) {
	const TEMPLATE = await TEMPLATEService.getAllTEMPLATE( context );
	reply.status( 200 ).send( TEMPLATE );
}

export async function getTEMPLATEById(
	context: ServerContext,
	req: FastifyRequest,
	reply: FastifyReply
) {
	const TEMPLATE = await TEMPLATEService.getTEMPLATEById( context, Number(req.params.id) );
	reply.status( 200 ).send( TEMPLATE );
}

//controller to create an TEMPLATE
export async function createTEMPLATE(
	context: ServerContext,
	req: FastifyRequest<{ Body: z.infer<typeof CreateTEMPLATESchema> }>,
	reply: FastifyReply
) {
	const parsed = CreateTEMPLATESchema.safeParse( req.body );
	if( !parsed.success )
		return reply.status( 400 ).send( { error: 'BAD_REQUEST', 
			message: 'Invalid Data' } );

	const TEMPLATE = await TEMPLATEService.createTEMPLATE( context, parsed.data );
	reply.status( 201 ).send( TEMPLATE );
}


//update TEMPLATE
export async function updateTEMPLATE(
	context: ServerContext,
	req: FastifyRequest,
	reply: FastifyReply,
) {
	const parsed = UpdateTEMPLATESchema.safeParse( req.body );
	if( !parsed.success )
		return reply.status( 400 ).send( { error: 'BAD_REQUEST', 
			message: 'Invalid Data' } );

	const TEMPLATE = await TEMPLATEService.updateTEMPLATE( context, req.params.id, parsed.data );
	reply.status( 200 ).send( TEMPLATE );
}

//delete TEMPLATE
export async function deleteTEMPLATE(
	context: ServerContext,
	req: FastifyRequest,
	reply: FastifyReply
) {
	const TEMPLATE = await TEMPLATEService.deleteTEMPLATE( context, number( req.params.id ) );
	return reply.status( 200 ).send( TEMPLATE );
}
