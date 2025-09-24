import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import oauthPlugin from '@fastify/oauth2';

const oAuth2Plugin = async (server: FastifyInstance) => {
  const { oauthClientId, oauthSecretSt } = server.config;

  server.register(oauthPlugin, {
    name: 'githubOAuth2',
    //scope: ['user:email', 'read:user'],
    credentials: {
      client: {
        id: oauthClientId,
        secret: oauthSecretSt,
      },
      auth: oauthPlugin.GITHUB_CONFIGURATION,
    },
    startRedirectPath: '/api/oauth',
    callbackUri: 'http://localhost:8082/api/oauth/callback',
  });
};

export default fp(oAuth2Plugin);
