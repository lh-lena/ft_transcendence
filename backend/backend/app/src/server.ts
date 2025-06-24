
// backend/src/server.ts
import Fastify from 'fastify';
import cors from '@fastify/cors'
import config from './config/config';
import dbConnector from './config/db';
import healthRoute from './routes/healthCheck';
import testRoute from './routes/testDb';

//build server
async function buildServer() {

	//build fastify instance
	const server = Fastify({ logger: true });

	//makes env variables avliable 
	server.decorate('config', config);

	//parse allowed origins
	const allowedOrigins = config.ALLOWED_ORIGINS ? 
		config.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : [];
	const allowedMethods = config.ALLOWED_METHODS ? 
		config.ALLOWED_METHODS.split(',').map(method => method.trim()).join(',') 
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

			await server.register(healthRoute);
			await server.register(dbConnector);
			await server.register(testRoute);

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
