import { zodSchemasToJSONSchemas } from '../../schemas/schemaHelper';

import { blockedSchemas } from '../../schemas/blocked';

export const blockedRefSchemas = zodSchemasToJSONSchemas(blockedSchemas);
