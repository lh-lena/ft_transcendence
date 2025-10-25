import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

import { healthSchemas } from '../schemas/health';
import { responseSchemas } from '../schemas/response';
import { userSchemas } from '../schemas/user';
import { gameSchemas } from '../schemas/game';
import { resultSchemas } from '../schemas/result';
import { friendSchemas } from '../schemas/friend';
import { blockedSchemas } from '../schemas/blocked';
import { tournamentSchemas } from '../schemas/tournament';
import { chatSchemas } from '../schemas/chat';

import { zodSchemasToJSONSchemas } from '../schemas/schemaHelper';

const CONVERTED_SCHEMAS = [
  ...Object.values(zodSchemasToJSONSchemas(healthSchemas)),
  ...Object.values(zodSchemasToJSONSchemas(responseSchemas)),
  ...Object.values(zodSchemasToJSONSchemas(userSchemas)),
  ...Object.values(zodSchemasToJSONSchemas(gameSchemas)),
  ...Object.values(zodSchemasToJSONSchemas(resultSchemas)),
  ...Object.values(zodSchemasToJSONSchemas(friendSchemas)),
  ...Object.values(zodSchemasToJSONSchemas(blockedSchemas)),
  ...Object.values(zodSchemasToJSONSchemas(tournamentSchemas)),
  ...Object.values(zodSchemasToJSONSchemas(chatSchemas)),
];

const schemaPlugin = async (server: FastifyInstance) => {
  const isDev = server.config.NODE_ENV === 'development';

  let registeredCount = 0;

  const errors: Array<{ schemaId: string; error: unknown }> = [];

  for (const schema of CONVERTED_SCHEMAS) {
    try {
      if (isDev) {
        server.log.debug({ schemaId: schema.$id }, `Registering schema: ${schema.$id}`);
      }

      server.addSchema(schema);
      registeredCount++;
    } catch (error) {
      errors.push({ schemaId: schema.$id!, error });
    }
  }

  if (errors.length > 0) {
    server.log.error(
      {
        failed: errors.length,
        total: CONVERTED_SCHEMAS.length,
        failedSchemas: errors.map((e) => e.schemaId),
      },
      'Some schemas failed to register',
    );
    throw new Error(`Failed to register ${errors.length} schema(s)`);
  }

  server.log.info(`Successfully registered ${registeredCount} schemas`);
};

export default fp(schemaPlugin, {
  name: 'schemas',
  fastify: '5.x',
  dependencies: ['config'],
});
