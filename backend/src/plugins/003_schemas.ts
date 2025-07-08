import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

import { userSchemas } from '../routes/user/user.schema';

const schemaPlugin = async ( server: FastifyInstance ) => {

  const allSchemas = [...Object.values( userSchemas )];

  for( const schema of allSchemas ) {
      server.addSchema( schema );
  }
}

export default fp( schemaPlugin );
