import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

import { userRefSchemas } from '../modules/user/user.schema';
import { responseRefSchemas } from '../modules/response/response.schema';
import { healthRefSchemas } from '../modules/health/health.schema';

const schemaPlugin = async ( server: FastifyInstance ) => {

  const schemaList = [
    ...Object.values( userRefSchemas ),
    ...Object.values( responseRefSchemas ),
    ...Object.values( healthRefSchemas ),
  ]

  for( const schema of schemaList ) {
    //console.log( `Registering schema: ${schema.$id}` );
      server.addSchema( schema );
  }
}

export default fp( schemaPlugin );
