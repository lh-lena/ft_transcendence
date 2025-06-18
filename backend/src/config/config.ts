//import env plugins
import dotenv from 'dotenv';
import envSchema from 'env-schema';

//load and check env variables
dotenv.config();

const schema = {
	type: 'object',
	required: [ 'PORT', 'HOST', 'ALLOWED_ORIGINS', 'ALLOWED_METHODS', 'DB_PATH' ],
	properties: {
		PORT: { type: 'string', default: '8080' },
		HOST: { type: 'string', default: '0.0.0.0' },
		DB_URL: { type: 'string' },
		ALLOWED_ORIGINS: { type: 'string', default: '' },
		ALLOWED_METHODS: { type: 'string', default: '' },
	}
}

const config = envSchema({ schema, dotenv: true });

export default config;
