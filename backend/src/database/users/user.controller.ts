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
	reply.send( users );
}

export async function getUserById(
	context: ServerContext,
	req: FastifyRequest,
	reply: FastifyReply
) {
	const user = await UserService.getUserById( context, Number( req.params.id ) );

	if( !user )
		return reply.status( 404 ).send( { error: 'User not found' } );
	reply.send( user );
}

//controller to create an user
export async function createUser(
	context: ServerContext,
	req: FastifyRequest<{ Body: z.infer<typeof CreateUserSchema> }>,
	reply: FastifyReply
) {
	
	const parsed = CreateUserSchema.safeParse( req.body );
	if( !parsed.success )
		return reply.status( 400 ).send( { error: parsed.error.flatten() } );
	
	const user = await UserService.createUser( context, parsed.data );
	reply.status( 200 ).send( user );
}


//update user
export async function updateUser(
	context: ServerContext,
	req: FastifyRequest,
	reply: FastifyReply,
) {
	const parsed = UpdateUserSchema.safeParse( req.body );
	if( !parsed.success )
		return reply.status( 400 ).send( { error: parsed.error.flatten() } );
	const user = await UserService.updateUser( context, req.params.id, parsed.data );
	reply.status( 200 ).send( user );
}

//delete user
export async function deleteUser(
	context: ServerContext,
	req: FastifyRequest,
	reply: FastifyReply
) {
	const user = await UserService.deleteUser( context, Number( req.params.id ) );

	return reply.status( 200 ).send( user );
}
