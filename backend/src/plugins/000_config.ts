import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import dotenv from 'dotenv';
import envSchema from 'env-schema';
import path from 'path';

//load and check env variables
const configPlugin = async ( server: FastifyInstance ) => {

	const schema = {
		type: 'object',
		required: ['PORT', 'HOST', 'DB_PATH', 'ALLOWED_ORIGINS', 'ALLOWED_METHODS'],
		properties: {
			PORT: { type: 'string', default: '8080' },
			HOST: { type: 'string', default: '0.0.0.0' },
			DB_PATH: { type: 'string' },
			ALLOWED_ORIGINS: { type: 'string', default: '' },
			ALLOWED_METHODS: { type: 'string', default: '' },
		}
	};

	dotenv.config( { path: path.resolve( __dirname, '../.env' ) } );

	const config = envSchema( { schema } );

	server.decorate( 'config', config );
}

export default fp( configPlugin );
