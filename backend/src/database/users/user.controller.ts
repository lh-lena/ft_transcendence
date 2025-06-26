import { FastifyRequest, FastifyReply } from 'fastify';
import { ServerContext } from '../../context';
import Database from 'better-sqlite3';

import { CreateUserSchema, UpdateUserSchema } from './user.schema';
import { NotFoundError, DatabaseError, ConflictError } from '../../errors';
import * as UserService from './user.service';

//controller for User get All or by Id
export async function getAllUsers(
	context: ServerContext,
	req: FastifyRequest,
	reply: FastifyReply 
) {
	try{
		const users = await UserService.getAllUsers( context );
		reply.status( 200 ).send( users );
	} catch( err ){
		console.log( err );
		if( err instanceof NotFoundError )
			return reply.status( 404 ).send( { message: err.message } );
		return reply.status( 500 ).send( { message: 'Internal Server Error' } );
	}
}

export async function getUserById(
	context: ServerContext,
	req: FastifyRequest,
	reply: FastifyReply
) {
	try{
		const user = await UserService.getUserById( context, Number(req.params.id) );
		reply.status( 200 ).send( user );
	} catch( err ){
		console.log( err );
		if( err instanceof NotFoundError )
			return reply.status( 404 ).send( { message: err.message } );
		return reply.status( 500 ).send( { message: 'Internal Server Error' } );
	}
}

//controller to create an user
export async function createUser(
	context: ServerContext,
	req: FastifyRequest<{ Body: z.infer<typeof CreateUserSchema> }>,
	reply: FastifyReply
) {
	try{	
		const parsed = CreateUserSchema.safeParse( req.body );
		const user = await UserService.createUser( context, parsed.data );
		reply.status( 201 ).send( user );
	} catch( err ){
		console.log( err );
		if( err instanceof ConflictError )
			return reply.status( 409 ).send( { message: err.message } );
		return reply.status( 500 ).send( { message: 'Internal Server Error' } );
	}
}


//update user
export async function updateUser(
	context: ServerContext,
	req: FastifyRequest,
	reply: FastifyReply,
) {
	try{ 
		const parsed = UpdateUserSchema.safeParse( req.body );
		const user = await UserService.updateUser( context, req.params.id, parsed.data );
		reply.status( 200 ).send( user );
	} catch( err ){
		console.log( err );
		if( err instanceof NotFoundError )
			return reply.status( 404 ).send( { message: err.message } );
		return reply.status( 500 ).send( { message: 'Internal Server Error' } );
	}
}

//delete user
export async function deleteUser(
	context: ServerContext,
	req: FastifyRequest,
	reply: FastifyReply
) {
	try{ 
		const user = await UserService.deleteUser( context, Number( req.params.id ) );
		return reply.status( 200 ).send( user );
	} catch( err ){
		if( err instanceof NotFoundError )
			return reply.status( 404 ).send( { message: err.message } );
		return reply.status( 500 ).send( { message: 'Internal Server Error' } );
		
	}
}
