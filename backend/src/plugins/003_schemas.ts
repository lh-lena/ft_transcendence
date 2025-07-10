import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

import { healthRefSchemas } from '../modules/health/health.schema';
import { responseRefSchemas } from '../modules/response/response.schema';
import { userRefSchemas } from '../modules/user/user.schema';
import { matchRefSchemas } from '../modules/match/match.schema';

const schemaPlugin = async ( server: FastifyInstance ) => {

  const schemaList = [
    ...Object.values( healthRefSchemas ),
    ...Object.values( responseRefSchemas ),
    ...Object.values( userRefSchemas ),
    ...Object.values( matchRefSchemas ),
  ]

  for( const schema of schemaList ) {
    console.log( `Registering schema: ${schema.$id}` );
    console.log( schema );
      server.addSchema( schema );
  }
}

export default fp( schemaPlugin );
