import { FastifyInstance } from 'fastify';

import { healthRoute } from './healthCheck';
import { userRoutes } from './user/user.routes';
import { AppError } from '../utils/error';
import { openAiDocs } from './openAiDocs';

export default async function registerRoutes( server: FastifyInstance ) {


	await server.register( healthRoute( server ) );

	await server.register( userRoutes( server ), { prefix: '/api' } );

	server.setErrorHandler( ( error, request, reply ) => {
		
		console.error( '🚨 Error Detected:', error );

		//TODO add abstactation for errors eg SQL_CONSTRAINT FOR UNIQE ones
		if( error instanceof AppError )
			return reply.status( error.statusCode ).send( { 
				error: error.code, 
				message: error.message,
				details: error.details
			} );
		
		if( error?.name === 'ZodError' )
			return reply.status( 400 ).send( { 
				error: 'BAD_REQUEST', message: 'Validation failed' } );
				
		return reply.status( 500 ).send( {
			error: 'INTERNAL_SERVER_ERROR', message: 'Serverside error' } );
	} );
}
