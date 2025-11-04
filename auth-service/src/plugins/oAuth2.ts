import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import oauthPlugin from '@fastify/oauth2';

/**
 * GitHub OAuth2 Plugin
 *
 * Configures GitHub OAuth2 authentication flow using @fastify/oauth2.
 * Provides routes for initiating OAuth and handling GitHub's callback.
 *
 * @requires config - Depends on config plugin for OAuth credentials
 * @decorates {object} githubOAuth2 - OAuth2 client for GitHub authentication
 */
const oAuth2Plugin = async (fastify: FastifyInstance) => {
  const { OAUTH_CLIENT_ID, OAUTH_SECRET, AUTH_URL } = fastify.config;

  const callbackUrl = `${AUTH_URL}/api/oauth/callback`;
  fastify.log.info(`Registering OAuth with callback: ${callbackUrl}`);

  try {
    await fastify.register(oauthPlugin, {
      name: 'githubOAuth2',
      scope: ['read:user'],
      credentials: {
        client: {
          id: OAUTH_CLIENT_ID,
          secret: OAUTH_SECRET,
        },
        auth: oauthPlugin.GITHUB_CONFIGURATION,
      },
      startRedirectPath: '/api/oauth',
      callbackUri: callbackUrl,
    });
  } catch (error) {
    fastify.log.error('Failed to register OAuth2 plugin');
    throw error;
  }
  fastify.log.info('OAuth2 plugin loaded');
};

export default fp(oAuth2Plugin, {
  name: 'github-oauth',
  dependencies: ['cookies', 'config'],
  fastify: '5.x',
});
