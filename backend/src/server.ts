
// backend/src/server.ts
import Fastify from 'fastify';
import cors from '@fastify/cors'
import config from './config';
import healthRoute from './routes/healthCheck';

//build server
async function buildServer() {

	//build fastify instance
	const server = Fastify({ logger: true });

	//makes env variables avliable 
	server.decorate('config', config);

	//parse allowed origins
	const allowedOrigins = config.ALLOWED_ORIGINS ?
		config.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : [];


	//register routers
	await server.register(cors, { 
		origin: allowedOrigins.length > 0 ? allowedOrigins: true, credentials: true,
	});

	await server.register(healthRoute);

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
