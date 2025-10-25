import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

import { createUserService } from '../services/user';
import { createGameService } from '../services/game';
import { createResultService } from '../services/result';
import { createTournamentService } from '../services/tournament';
import { createChatService } from '../services/chat';
import { createBlockedService } from '../services/blocked';
import { createFriendService } from '../services/friend';

const servicesPlugin = async (server: FastifyInstance) => {
  const user = createUserService(server);
  const game = createGameService(server);
  const tournament = createTournamentService(server, game);
  const result = createResultService(server, game, tournament);
  const blocked = createBlockedService(server);
  const chat = createChatService(server, blocked);
  const friend = createFriendService(server);

  server.decorate('services', {
    user,
    game,
    result,
    tournament,
    chat,
    blocked,
    friend,
  });
};

export default fp(servicesPlugin, {
  name: 'services',
  dependencies: ['config', 'prisma', 'realtime'],
});
