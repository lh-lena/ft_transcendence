import { zodSchemasToJSONSchemas } from '../../schemas/schemaHelper';

import { matchHistrorySchemas } from '../../schemas/matchHistory';

export const matchHistoryRefSchemas = zodSchemasToJSONSchemas( matchHistiorySchemas );
