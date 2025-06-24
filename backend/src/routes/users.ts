import { FastifyInstance } from 'fastify';
import { UserController } from '../modules/users';

export default async function userRoutes( fastify: FastifyInstance ) {
	fastify.get( '/users', async ( request, reply ) => {
		UserController.getAllUsers( fastify.db, request, reply ) } );
	fastify.get( '/users:id', async ( request, reply ) => {          
		UserController.getUserById( fastify.db, request, reply ) } );
	fastify.post( '/users', async ( request, reply ) => {            
		UserController.createUser( fastify.db, request, reply ) } );
}

