import { toJSONSchema, type ZodType } from 'zod/v4';

export function zodSchemasToJSONSchemas( schemas: ZodType[] ) {
  const jsonSchemas = schemas.map( ( schema ) => {
    return toJSONSchema( schema, {
      target: "draft-7",
      unrepresentable: "any",
    })
  })
  return jsonSchemas
}
