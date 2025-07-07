import Fastify from 'fastify';
import cors from '@fastify/cors'
import AutoLoad from '@fastify/autoload';
import Path from 'path';

//build server
export async function buildServer() {

	//build fastify instance
	const server = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  server.register( AutoLoad, {
    dir: Path.join( __dirname, 'plugins'),
  } )

  server.register( AutoLoad, {
    dir: Path.join(__dirname, 'routes'),
  } )

  await server.ready();

			

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
