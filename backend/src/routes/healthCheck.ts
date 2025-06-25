//src/routes/healtCheck.ts
import { FastifyInstance } from 'fastify';
import { ServerContext } from '../context';

export function healthRoute( context: ServerContext ) {
	return async function ( server: FastifyInstance ) {

	const db = context.db;

		server.get( '/health', async ( request, reply ) => {

			let dbStatus = 'unknown';
			try {
				const stmt = db.prepare( 'SELECT 1' );
				stmt.get();

				dbStatus = 'ok';
			} catch( err ){
				dbStatus = 'unreachable';
			}

			const healthStatus = {
				service: 'backend',
				message: 'OK',
				uptime: process.uptime(),
				timestamp: Date.now(),
				db: dbStatus		};

				reply.code( dbStatus == 'ok' ? 200 : 500 ).send( healthStatus );
		});
};
}
