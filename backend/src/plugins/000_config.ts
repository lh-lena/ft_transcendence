import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import dotenv from 'dotenv';
import envSchema from 'env-schema';
import path from 'path';

export const schema = {
  type: 'object',
  required: ['PORT', 'HOST', 'DATABASE_URL', 'ALLOWED_ORIGINS', 'ALLOWED_METHODS'],
  properties: {
    PORT: { type: 'string' },
    HOST: { type: 'string' },
    DATABASE_URL: { type: 'string' },
    ALLOWED_ORIGINS: { type: 'string' },
    ALLOWED_METHODS: { type: 'string' },
  },
};

export interface Config {
  PORT: string;
  HOST: string;
  DATABASE_URL: string;
  ALLOWED_ORIGINS: string;
  ALLOWED_METHODS: string;
}

//load and check env variables
const configPlugin = async (server: FastifyInstance) => {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });

  const config = envSchema<Config>({ schema });

  // console.log(config);

  server.decorate('config', config);
};

export default fp(configPlugin);
