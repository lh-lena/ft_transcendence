import { FastifyRequest, FastifyReply } from 'fastify';
import { ServerContext } from '../../context';
import Database from 'better-sqlite3';

import { CreateUserSchema, UpdateUserSchema } from './user.schema';
import * as UserService from './user.service';

//controller for User get All or by Id
export async function getAllUsers(
	context: ServerContext,
	req: FastifyRequest,
	reply: FastifyReply 
) {
	const users = await UserService.getAllUsers( context );
	reply.status( 200 ).send( users );
}

export async function getUserById(
	context: ServerContext,
	req: FastifyRequest,
	reply: FastifyReply
) {
	const user = await UserService.getUserById( context, Number(req.params.id) );
	reply.status( 200 ).send( user );
}

//controller to create an user
export async function createUser(
	context: ServerContext,
	req: FastifyRequest<{ Body: z.infer<typeof CreateUserSchema> }>,
	reply: FastifyReply
) {
	const parsed = CreateUserSchema.safeParse( req.body );
	if( !parsed.success )
		return reply.status( 400 ).send( { error: 'BAD_REQUEST', 
			message: 'Invalid Data' } );

	const user = await UserService.createUser( context, parsed.data );
	reply.status( 201 ).send( user );
}


//update user
export async function updateUser(
	context: ServerContext,
	req: FastifyRequest,
	reply: FastifyReply,
) {
	const parsed = UpdateUserSchema.safeParse( req.body );
	if( !parsed.success )
		return reply.status( 400 ).send( { error: 'BAD_REQUEST', 
			message: 'Invalid Data' } );

	const user = await UserService.updateUser( context, req.params.id, parsed.data );
	reply.status( 200 ).send( user );
}

//delete user
export async function deleteUser(
	context: ServerContext,
	req: FastifyRequest,
	reply: FastifyReply
) {
	const user = await UserService.deleteUser( context, number( req.params.id ) );
	return reply.status( 200 ).send( user );
}
