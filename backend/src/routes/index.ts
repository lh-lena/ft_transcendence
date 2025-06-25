import { FastifyInstance } from 'fastify';
import { ServerContext } from '../server.context';

import { healthRoute } from './healthCheck';
import { userRoutes } from './users';

export default async function registerRoutes( context: ServerContext ) {
	await context.server.register( healthRoute( context ) );
	await context.server.register( userRoutes( context ), { prefix: '/api' } );
}
