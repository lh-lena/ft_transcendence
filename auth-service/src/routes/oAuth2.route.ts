import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fetch from 'node-fetch';
import fp from 'fastify-plugin';

type GithubUser = {
  username: string;
  avatar: string;
  githubId: number;
  guest: boolean;
};

const oAuth2Routes = async (server: FastifyInstance) => {
  async function regOrlogUser(githubUser: GithubUser) {
    const user = await server.user.getUser({ githubdId: githubUser.githubId });

    if (user) return user;

    const newUser = await server.user.post(githubUser);
    return newUser;
  }

  async function fetchGithubUser(accessToken: string) {
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    });

    const user = (await userRes.json()) as { login: string; avatar_url: string; id: number };

    return {
      username: user.login,
      avatar: user.avatar_url,
      githubId: user.id,
      guest: false,
    };
  }

  server.get('/api/oauth/callback', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = await server.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);

      const githubUser = await fetchGithubUser(token.token.access_token);

      const user = await regOrlogUser(githubUser);

      const accessToken = server.generateAccessToken({ id: user.userId });
      const refreshToken = server.generateRefreshToken({ id: user.userId });

      const frontendUrl = server.config.frontendUrl;

      reply.setAuthCookie('jwt', accessToken);
      reply.setAuthCookie('refreshToken', refreshToken, { path: '/api/refresh' });

      reply.type('text/html').send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OAuth Success</title>
        </head>
        <body>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_SUCCESS',
                  userId: '${user.userId}'
                }, '${frontendUrl}');
              }
              window.close();
            } catch (error) {
              console.error('Error communicating with parent window:', error);
              document.body.innerHTML = '<h1>Authentication successful! You can close this window.</h1>';
            }
          </script>
          <h1>Authentication successful! This window should close automatically.</h1>
        </body>
      </html>
    `);
    } catch (error: any) {
      console.error('OAuth callback error:', error);

      const frontendUrl = server.config.frontendUrl;

      reply.type('text/html').send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OAuth Error</title>
        </head>
        <body>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_ERROR',
                  error: '${error.message || 'Authentication failed'}'
                }, '${frontendUrl}');
              }
              window.close();
            } catch (error) {
              console.error('Error communicating with parent window:', error);
              document.body.innerHTML = '<h1>Authentication failed! You can close this window.</h1>';
            }
          </script>
          <h1>Authentication failed! You can close this window.</h1>
        </body>
      </html>
    `);
    }
  });
};
export default fp(oAuth2Routes);
