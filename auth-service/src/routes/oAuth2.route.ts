import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fetch from 'node-fetch';
import fp from 'fastify-plugin';
import { AxiosRequestConfig } from 'axios';

interface GithubUser {
  username: string;
  avatar: string;
  githubId: number;
  guest: boolean;
}

const oAuth2Routes = async (server: FastifyInstance) => {
  async function regOrlogUser(githubUser: GithubUser) {
    const githubId = githubUser.githubId.toString();
    try {
      const user = await server.user.getUser({ githubId: githubId });
      console.log('user found:', user);
      if (user.online) {
        return null;
      }

      return user;
    } catch {
      let path;
      if (githubUser.avatar) {
        const config: AxiosRequestConfig = {
          method: 'post',
          url: `/upload/github`,
          data: {
            githubAvatarUrl: githubUser.avatar,
          },
        };
        const response = await server.api(config);
        if (response.success) path = response.storedName;
      }
      if (!path) path = null;

      const newUser = await server.user.post({
        ...githubUser,
        githubId: githubId,
        color: '#dff41a',
        colormap: 'neutral',
        avatar: path,
      });

      return newUser;
    }
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

      const frontendUrl = await server.config.frontendUrl;

      const user = await regOrlogUser(githubUser);
      if (user === null) {
        throw new Error('User is already online.');
      }

      if (user.tfaEnabled) {
        const tfaData = await server.tfa.handletfa(user);

        // Return HTML that sends data and closes window
        return reply.type('text/html').send(`
      <!DOCTYPE html>
      <html>
        <head><title>2FA Required</title></head>
        <body>
          <script>
            const data = ${JSON.stringify({
              type: '2FA_REQUIRED',
              sessionId: tfaData.sessionId,
              userId: tfaData.userId,
              tfaMethod: tfaData.tfaMethod,
              message: '2FA verification required',
            })};
            
            try {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_RESULT',
                  data: data
                }, '${frontendUrl}');
              }
              window.close();
            } catch (error) {
              console.error('Error communicating with parent window:', error);
              document.body.innerHTML = '<h1>2FA verification required. Please return to the main window.</h1>';
            }
          </script>
          <h1>2FA verification required. This window should close automatically.</h1>
        </body>
      </html>
      `);
      }

      reply = reply.setAuthCookies(user.userId);

      const authData = reply.authData;
      if (!authData) return reply.code(500).send('Authentication data missing');
      console.log('authData:', authData);

      return reply.type('text/html').send(`
    <!DOCTYPE html>
    <html>
      <head><title>OAuth Success</title></head>
      <body>
        <script>
          const data = ${JSON.stringify({
            type: 'OAUTH_SUCCESS',
            userId: user.userId,
            jwt: authData.jwt,
            message: 'Authentication successful',
          })};
          
          try {
            if (window.opener) {
              window.opener.postMessage({
                type: 'OAUTH_RESULT',
                data: data
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
    } catch {
      const frontendUrl = server.config.frontendUrl;

      return reply.type('text/html').send(`
    <!DOCTYPE html>
    <html>
      <head><title>OAuth Error</title></head>
      <body>
        <script>
          const data = ${JSON.stringify({
            type: 'OAUTH_ERROR',
            error: 'Authentication failed',
          })};
          
          try {
            if (window.opener) {
              window.opener.postMessage({
                type: 'OAUTH_RESULT',
                data: data
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
