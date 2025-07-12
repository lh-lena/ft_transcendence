import { zodSchemasToJSONSchemas } from '../../schemas/schemaHelper';

import { responseSchemas } from '../../schemas/response';

export const responseRefSchemas = zodSchemasToJSONSchemas( responseSchemas );
