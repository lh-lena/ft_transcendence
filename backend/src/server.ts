import Fastify from 'fastify';
import cors from '@fastify/cors'

import configCreate from './config/config';
import dbCreate from './config/db';
import registerRoutes from './routes/index';

import { createContext, ServerContext } from './server.context';

//build server
async function buildServer() {

	//build fastify instance
	const server = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();


	//makes env variables avliable 
	await configCreate( server );
	await dbCreate( server );


	const context = createContext( server, server.db, server.config );

	await registerRoutes( context );


	//parse allowed origins
	const allowedOrigins = context.config.ALLOWED_ORIGINS ? 
		context.config.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : [];

	const allowedMethods = context.config.ALLOWED_METHODS ? 
		context.config.ALLOWED_METHODS.split(',').map(method => method.trim()).join(',') 
			: [];

			//register cors, healthcheck, db, etc.
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
			

	return server;
}

//start server
async function start() {
	
	try{
		const server = await buildServer();
		const PORT = parseInt(server.config.PORT);

		//start listening with the instance
		await server.listen({ port: PORT, host: server.config.HOST });
	  } catch (err) {
	    console.error(err);
	    process.exit(1);
	  }
}


start();
