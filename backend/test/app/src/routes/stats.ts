import { FastifyInstance } from 'fastify';
import { ServerContext } from '../context';
import * as statsController from '../database/stats/stats.controller';

export function statsRoutes( context: ServerContext ) {
	return async function( server: FastifyInstance ) {

		server.get( '/stats', async ( request, reply ) => {
			await statsController.getAllstats( context, request, reply ) } );

		server.get( '/stats/:id', async ( request, reply ) => {          
			await statsController.getstatsById( context, request, reply ) } );

		server.post( '/stats', async ( request, reply ) => {            
			await statsController.createstats( context, request, reply ) } );

		server.patch( '/stats/:id', async ( request, reply ) => {
			await statsController.updatestats( context, request, reply ) } );

		server.delete( '/stats/:id', async( request, reply ) => {
			await statsController.deletestats( context, request, reply ) } );

	};
}
