import { zodSchemasToJSONSchemas } from '../../schemas/schemaHelper';

import { matchSchemas } from '../../schemas/match';

export const matchRefSchemas = zodSchemasToJSONSchemas( matchSchemas );
