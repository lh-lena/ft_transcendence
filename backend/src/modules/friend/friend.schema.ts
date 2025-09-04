import { zodSchemasToJSONSchemas } from '../../schemas/schemaHelper';

import { friendSchemas } from '../../schemas/friend';

export const friendRefSchemas = zodSchemasToJSONSchemas(friendSchemas);
