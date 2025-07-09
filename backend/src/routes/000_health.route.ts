import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

const healthRoute = async ( server: FastifyInstance ) => {

		server.get( '/api/health', {
      schema: {
        response: {
          200: { $ref: 'healthCheck' },
          500: { $ref: 'InternalError' },
        },
        summary: 'Health Check',
      },
      handler: async ( request, reply ) => {

		    	let dbStatus = 'down';

		    	try {
		    		const stmt = server.db.prepare( 'SELECT 1' );
		    		stmt.get();
		    		dbStatus = 'up';
		    	} catch {
		    		dbStatus = 'unreachable';
		    	}

		    	const healthStatus = {
            status: 'ok',
		    		service: 'backend',
						timestamp: new Date().toISOString(),
		    		dbStatus: dbStatus		
          };

			  return healthStatus;

      },
    });
};

export default fp( healthRoute );
