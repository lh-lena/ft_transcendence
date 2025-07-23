import { zodSchemasToJSONSchemas } from '../../schemas/schemaHelper';

import { gameSchemas } from '../../schemas/game';

export const gameRefSchemas = zodSchemasToJSONSchemas( gameSchemas );
