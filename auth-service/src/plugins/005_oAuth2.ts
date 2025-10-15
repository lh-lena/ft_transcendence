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
  const { oauthClientId, oauthSecretSt, backendUrl } = fastify.config;

  /**
   * Register GitHub OAuth2 provider
   * Initiates OAuth flow at /api/oauth
   * Handles callback at /api/oauth/callback
   */
  try {
    await fastify.register(oauthPlugin, {
      name: 'githubOAuth2',
      scope: ['user:email', 'read:user'], // GitHub user profile and email access
      credentials: {
        client: {
          id: oauthClientId,
          secret: oauthSecretSt,
        },
        auth: oauthPlugin.GITHUB_CONFIGURATION, // Uses GitHub's OAuth endpoints
      },
      startRedirectPath: '/api/oauth',
      callbackUri: `${backendUrl}/api/oauth/callback`,
    });
  } catch (error) {
    fastify.log.error('Failed to register OAuth2 plugin');
    throw error;
  }
  fastify.log.info('OAuth2 plugin loaded');
};

export default fp(oAuth2Plugin, {
  name: 'github-oauth',
  dependencies: ['config'],
  fastify: '5.x',
});
