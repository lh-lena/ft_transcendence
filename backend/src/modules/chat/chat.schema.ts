import { zodSchemasToJSONSchemas } from '../../schemas/schemaHelper';

import { chatSchemas } from '../../schemas/chat';

export const chatRefSchemas = zodSchemasToJSONSchemas(chatSchemas);
