import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

const configPlugin = async (fastify: FastifyInstance) => {
  //set secrets in docker-compose.yml
  const accessSecret = process.env.ACCESS_TOKEN_SECRET;
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
  if (!accessSecret || !refreshSecret) {
    throw new Error('JWT secrets are not defined in environment variables');
  }

  const oauthClientId = process.env.GITHUB_CLIENT_ID;
  const oauthSecretSt = process.env.GITHUB_CLIENT_SECRET;
  if (!oauthClientId || !oauthSecretSt) {
    throw new Error('OAuth secrets are not defined in enviormanet variables');
  }

  //TODO add proper logging
  let port = Number(process.env.PORT);
  if (!port) {
    console.warn('Using default port: 8082');
    port = 8082;
  }

  let host = process.env.HOST;
  if (!host) {
    console.warn('Using default host: 0.0.0.0');
    host = '0.0.0.0';
  }

  const config = {
    accessSecret,
    refreshSecret,
    oauthClientId,
    oauthSecretSt,
    port,
    host,
  };

  fastify.decorate('config', config);
};

export default fp(configPlugin);
