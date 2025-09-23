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
    const token = await server.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);

    const githubUser = await fetchGithubUser(token.token.access_token);

    const user = await regOrlogUser(githubUser);
    await server.tfa.sendJwt(user, reply);
  });
};
export default fp(oAuth2Routes);
