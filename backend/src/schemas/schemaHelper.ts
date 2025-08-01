import { toJSONSchema, type ZodType } from 'zod/v4';

export function zodSchemasToJSONSchemas( schemas: ZodType[] ) {
  schemas.forEach( (schema, i) => {
    if( !schema || typeof schema._def !== 'object' ) {
      console.log( 'Schema at index ${i} is invalid: ${schema}' );
    }
  });
  console.log( schemas.map( (s, i) => [i, s]));
  const jsonSchemas = schemas.map( ( schema ) => {
    return toJSONSchema( schema, {
      target: "draft-7",
      unrepresentable: "any",
    })
  })
  return jsonSchemas
}
