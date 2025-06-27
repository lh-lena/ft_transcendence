import { FastifyRequest, FastifyReply } from 'fastify';
import { ServerContext } from '../../context';
import Database from 'better-sqlite3';

import { CreateuserSchema, UpdateuserSchema } from './user.schema';
import * as userService from './user.service';

//controller for user get All or by Id
export async function getAlluser(
	context: ServerContext,
	req: FastifyRequest,
	reply: FastifyReply 
) {
	const user = await userService.getAlluser( context );
	reply.status( 200 ).send( user );
}

export async function getuserById(
	context: ServerContext,
	req: FastifyRequest,
	reply: FastifyReply
) {
	const user = await userService.getuserById( context, Number(req.params.id) );
	reply.status( 200 ).send( user );
}

//controller to create an user
export async function createuser(
	context: ServerContext,
	req: FastifyRequest<{ Body: z.infer<typeof CreateuserSchema> }>,
	reply: FastifyReply
) {
	const parsed = CreateuserSchema.safeParse( req.body );
	if( !parsed.success )
		return reply.status( 400 ).send( { error: 'BAD_REQUEST', 
			message: 'Invalid Data' } );

	const user = await userService.createuser( context, parsed.data );
	reply.status( 201 ).send( user );
}


//update user
export async function updateuser(
	context: ServerContext,
	req: FastifyRequest,
	reply: FastifyReply,
) {
	const parsed = UpdateuserSchema.safeParse( req.body );
	if( !parsed.success )
		return reply.status( 400 ).send( { error: 'BAD_REQUEST', 
			message: 'Invalid Data' } );

	const user = await userService.updateuser( context, req.params.id, parsed.data );
	reply.status( 200 ).send( user );
}

//delete user
export async function deleteuser(
	context: ServerContext,
	req: FastifyRequest,
	reply: FastifyReply
) {
	const user = await userService.deleteuser( context, Number( req.params.id ) );
	return reply.status( 200 ).send( user );
}
