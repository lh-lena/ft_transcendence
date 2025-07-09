import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

const healthRoute = async ( server: FastifyInstance ) => {

		server.get( '/health', async ( request, reply ) => {

			let dbStatus = 'unknown';

			try {
				const stmt = server.db.prepare( 'SELECT 1' );
				stmt.get();
				dbStatus = 'ok';
			} catch {
				dbStatus = 'unreachable';
			}

			const healthStatus = {
				service: 'backend',
				message: 'OK',
				uptime: process.uptime(),
				timestamp: Date.now(),
				db: dbStatus		};

				reply.code( dbStatus === 'ok' ? 200 : 500 ).send( healthStatus );
		});
};

export default fp( healthRoute );
