import { zodSchemasToJSONSchemas } from '../../schemas/schemaHelper';

import { healthSchemas } from '../../schemas/health';

export const healthRefSchemas = zodSchemasToJSONSchemas( healthSchemas );
