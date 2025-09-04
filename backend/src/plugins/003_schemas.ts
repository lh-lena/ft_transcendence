import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

import { healthRefSchemas } from '../modules/health/health.schema';
import { responseRefSchemas } from '../modules/response/response.schema';
import { userRefSchemas } from '../modules/user/user.schema';
import { gameRefSchemas } from '../modules/game/game.schema';
import { resultRefSchemas } from '../modules/result/result.schema';
import { friendRefSchemas } from '../modules/friend/friend.schema';
import { blockedRefSchemas } from '../modules/blocked/blocked.schema';
import { tournamentRefSchemas } from '../modules/tournament/tournament.schema';
import { chatRefSchemas } from '../modules/chat/chat.schema';

const schemaPlugin = async (server: FastifyInstance) => {
  const schemaList = [
    ...Object.values(healthRefSchemas),
    ...Object.values(responseRefSchemas),
    ...Object.values(userRefSchemas),
    ...Object.values(gameRefSchemas),
    ...Object.values(resultRefSchemas),
    ...Object.values(friendRefSchemas),
    ...Object.values(blockedRefSchemas),
    ...Object.values(tournamentRefSchemas),
    ...Object.values(chatRefSchemas),
  ];

  for (const schema of schemaList) {
    // console.log(`Registering schema: ${schema.$id}`);
    // console.log(schema);
    server.addSchema(schema);
  }
};

export default fp(schemaPlugin);
