import { FastifyInstance } from 'fastify';
import { ServerContext } from '../context';
import * as userController from '../database/user/user.controller';

export function userRoutes( context: ServerContext ) {
	return async function( server: FastifyInstance ) {

		server.get( '/user', async ( request, reply ) => {
			await userController.getAllorFiltereduser( context, request, reply ) } );

		server.get( '/user/:id', async ( request, reply ) => {          
			await userController.getuserById( context, request, reply ) } );

		server.post( '/user', async ( request, reply ) => {            
			await userController.createuser( context, request, reply ) } );

		server.patch( '/user/:id', async ( request, reply ) => {
			await userController.updateuser( context, request, reply ) } );

		server.delete( '/user/:id', async( request, reply ) => {
			await userController.removeuser( context, request, reply ) } );

	};
}
