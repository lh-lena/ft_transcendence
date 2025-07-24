import { zodSchemasToJSONSchemas } from '../../schemas/schemaHelper';

import { resultSchemas } from '../../schemas/result';

export const resultRefSchemas = zodSchemasToJSONSchemas( resultSchemas );
