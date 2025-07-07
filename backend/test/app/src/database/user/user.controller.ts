import { FastifyRequest, FastifyReply } from 'fastify';
import { ServerContext } from '../../context';
import Database from 'better-sqlite3';

import { CreateuserSchema, UpdateuserSchema } from './user.schema';
import * as userService from './user.service';

//controller for user get All or by Id
export async function getAllorFiltereduser(
	context: ServerContext,
	req: FastifyRequest,
	reply: FastifyReply 
) {
	const filters = req.query as Record<string, any >;
	const user = await userService.getAllorFiltereduser( context, filters );
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
export async function removeuser(
	context: ServerContext,
	req: FastifyRequest,
	reply: FastifyReply
) {
	const user = await userService.removeuser( context, Number( req.params.id ) );
	return reply.status( 200 ).send( user );
}
