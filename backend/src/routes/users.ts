import { FastifyInstance } from 'fastify';
import { ServerContext } from '../context';
import * as UserController from '../database/users/user.controller';

export function userRoutes( context: ServerContext ) {
	return async function( server: FastifyInstance ) {

		server.get( '/users', async ( request, reply ) => {
			await UserController.getAllUsers( context, request, reply ) } );

		server.get( '/users/:id', async ( request, reply ) => {          
			await UserController.getUserById( context, request, reply ) } );

		server.post( '/users', async ( request, reply ) => {            
			await UserController.createUser( context, request, reply ) } );

		server.patch( '/users/:id', async ( request, reply ) => {
			await UserController.updateUser( context, request, reply ) } );

		server.delete( '/users/:id', async( request, reply ) => {
			await UserController.deleteUser( context, request, reply ) } );

	};
}
