import { zodSchemasToJSONSchemas } from '../../schemas/schemaHelper';

import { userSchemas } from '../../schemas/user';

export const userRefSchemas = zodSchemasToJSONSchemas( userSchemas );
