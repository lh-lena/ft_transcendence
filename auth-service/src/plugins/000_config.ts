import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Configuration Plugin
 *
 * Loads and validates environment variables required for the auth service.
 * Must be loaded first as other plugins depend on fastify.config
 *
 * @decorates {object} config - Configuration object containing secrets, URLs, and server settings
 * @throws {Error} If required environment variables are missing
 */
const configPlugin = async (fastify: FastifyInstance) => {
  // Validate JWT secrets
  const accessSecret = process.env.ACCESS_TOKEN_SECRET;
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
  if (!accessSecret || !refreshSecret) {
    throw new Error('JWT secrets are not defined in environment variables');
  }

  const oauthClientId = process.env.GITHUB_CLIENT_ID;
  const oauthSecretSt = process.env.GITHUB_CLIENT_SECRET;
  if (!oauthClientId || !oauthSecretSt) {
    throw new Error('OAuth secrets are not defined in environment variables');
  }

  const frontendUrl = process.env.FRONTEND_URL;
  const backendUrl = process.env.BACKEND_URL;
  const realtimeUrl = process.env.REALTIME_URL;
  if (!frontendUrl || !backendUrl || !realtimeUrl) {
    throw new Error('Service URLs are not defined in environment variables');
  }

  const nodeEnv = process.env.NODE_ENV || 'development';
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    fastify.log.warn(`Invalid NODE_ENV: ${nodeEnv}, defaulting to development`);
  }

  const port = Number(process.env.PORT);
  if (!port) {
    throw new Error('Host is not defined in environment variables');
  }

  const host = process.env.HOST;
  if (!host) {
    throw new Error('Host is not defined in environment variables');
  }

  /**
   * Configuration object exposed via fastify.config
   * @property {string} accessSecret - JWT access token secret
   * @property {string} refreshSecret - JWT refresh token secret
   * @property {string} oauthClientId - GitHub OAuth client ID
   * @property {string} oauthSecretSt - GitHub OAuth client secret
   * @property {number} port - Server port
   * @property {string} host - Server host
   * @property {string} frontendUrl - Frontend service URL
   * @property {string} backendUrl - Backend service URL
   * @property {string} realtimeUrl - Realtime service URL
   */

  const config = {
    accessSecret,
    refreshSecret,
    oauthClientId,
    oauthSecretSt,
    port,
    host,
    frontendUrl,
    backendUrl,
    realtimeUrl,
    nodeEnv,
  };

  fastify.decorate('config', config);
  fastify.log.info('Configuration loaded successfully');
};

export default fp(configPlugin, {
  name: 'config',
  fastify: '5.x',
});
