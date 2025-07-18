import { zodSchemasToJSONSchemas } from '../../schemas/schemaHelper';

import { matchHistorySchemas } from '../../schemas/matchHistory';

export const matchHistoryRefSchemas = zodSchemasToJSONSchemas( matchHistorySchemas );
