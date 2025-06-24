//src/routes/healtCheck.ts

import { FastifyInstance } from 'fastify';

export default async function healthRoute( server: FastifyInstance ) {
	server.get( '/health', async ( request, reply ) => {
		const healthStatus = {
			service: 'backend',
			message: 'OK',
			uptime: process.uptime(),
			timestamp: Date.now(),
			db: 'TODO:: add dynamic check for database'
		};

		reply.code(200).send(healthStatus);
	});
}
