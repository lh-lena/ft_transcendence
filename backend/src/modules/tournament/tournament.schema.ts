import { zodSchemasToJSONSchemas } from '../../schemas/schemaHelper';

import { tournamentSchemas } from '../../schemas/tournament';

export const tournamentRefSchemas = zodSchemasToJSONSchemas( tournamentSchemas );
