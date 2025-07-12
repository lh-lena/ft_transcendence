import { FastifyInstance } from 'fastify';
import { ServerContext } from '../context';
import * as gameController from '../database/game/game.controller';

export function gameRoutes( context: ServerContext ) {
	return async function( server: FastifyInstance ) {

		server.get( '/game', async ( request, reply ) => {
			await gameController.getAllgame( context, request, reply ) } );

		server.get( '/game/:id', async ( request, reply ) => {          
			await gameController.getgameById( context, request, reply ) } );

		server.post( '/game', async ( request, reply ) => {            
			await gameController.creategame( context, request, reply ) } );

		server.patch( '/game/:id', async ( request, reply ) => {
			await gameController.updategame( context, request, reply ) } );

		server.delete( '/game/:id', async( request, reply ) => {
			await gameController.deletegame( context, request, reply ) } );

	};
}
