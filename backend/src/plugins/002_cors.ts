import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

import cors from '@fastify/cors';

const corsPlugin = async ( server: FastifyInstance ) => {

  //parse allowed origins
	const allowedOrigins = server.config.ALLOWED_ORIGINS ? 
		server.config.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : [];

	const allowedMethods = server.config.ALLOWED_METHODS ? 
		server.config.ALLOWED_METHODS.split(',').map(method => method.trim()).join(',') 
			: [];

			await server.register(cors, { 
				origin: (origin , cb) => {
					if(!origin) return cb(null, true);
					if(allowedOrigins.includes(origin)) cb(null, true);
					//TODO:: add logging of cors violations??
					cb(new Error("Not allowed with CORS"), false);
				},
				methods: allowedMethods,
				credentials: true,
			});

}

export default fp( corsPlugin );
