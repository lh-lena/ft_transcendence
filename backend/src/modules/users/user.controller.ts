import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateUserSchema } from './user.schema';
import * as UserService from './user.service';

//controller for User get All or by Id
export async function getAllUsers( db, req: FastifyRequest, reply: FastifyReply ) {
	const users = await UserService.getAllUsers();
	reply.send(users);
}

export async function getUserById( db, req: FastifyRequest, reply: FastifyReply ) {
	const user = await UserService.getUserById( Number( req.params.id ) );
	//TODO check for correct errorhandling
	if( !user )
		return reply.status( 404 ).send( { error: 'User not found' } );
	reply.send( user );
}

//controller to create an user
export async function createUser( db,
	req: FastifyRequest<{ Body: z.infer<typeof CreateUserSchema> }>,
	reply: FastifyReply ) {
	
	const parsed = CreateUserSchema.safeParse( req.body );
	if( !parsed.success )
		return reply.status( 400 ).send( { error: parsed.error.flatten() } );
	
	const user = await UserService.createUser( parsed.data );
	reply.status( 200 ).send( user );
}
