import { zodSchemasToJSONSchemas } from '../../schemas/schemaHelper';

import { TMPSchemas } from '../../schemas/TMP';

export const TMPRefSchemas = zodSchemasToJSONSchemas( TMPSchemas );
