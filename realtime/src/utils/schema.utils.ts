import { toJSONSchema, type ZodType } from 'zod/v4';
import { WsClientMessageSchema, WsServerBroadcastSchemas } from '../schemas/ws.schema.js';

export function convertZodToJsonSchema(schema: ZodType) {
  return toJSONSchema(schema, {
    target: 'draft-7',
    unrepresentable: 'any',
  });
}

function extractIncomingJSONSchemas<T>(
  processor: (eventValue: string, payloadName: string, payloadSchema: unknown) => T,
): T[] {
  const discriminatedUnion = WsClientMessageSchema as any;
  const options = discriminatedUnion._def.options;
  const discriminator = discriminatedUnion._def.discriminator;

  return options.map((option: any) => {
    const shape = typeof option?._def?.shape === 'function' ? option._def.shape() : option.shape;
    const eventField = shape[discriminator];
    const eventValue = eventField?.value;
    const payloadField = shape.payload;
    const JsonSchema = convertZodToJsonSchema(payloadField as ZodType);
    const schemaName = JsonSchema.$id || 'Unknown Payload';

    return processor(eventValue, schemaName, JsonSchema);
  });
}

export function getIncomingMessages(): { event: string; payload: string }[] {
  return extractIncomingJSONSchemas((eventValue, payloadName, _) => {
    return {
      event: eventValue,
      payload: payloadName,
    };
  });
}

export function getOutgoingMessages(): Record<string, string>[] {
  return Object.entries(WsServerBroadcastSchemas).map(([event, schema]) => {
    const JsonSchema = convertZodToJsonSchema(schema as ZodType);
    const schemaName = JsonSchema.$id || 'Unknown Payload';

    return {
      event,
      payload: schemaName,
    };
  });
}

export function getIncomingJSONSchemas(): Record<string, unknown> {
  const schemas: Record<string, unknown> = {};

  extractIncomingJSONSchemas((_, payloadName, payloadSchema) => {
    schemas[payloadName] = payloadSchema;
  });

  return schemas;
}

export function getOutgoingJSONSchemas(): Record<string, unknown> {
  const schemas: Record<string, unknown> = {};

  Object.entries(WsServerBroadcastSchemas).forEach(([_, schema]) => {
    const JsonSchema = convertZodToJsonSchema(schema as ZodType);
    const schemaName = JsonSchema.$id || 'Unknown Payload';
    schemas[schemaName] = JsonSchema;
  });

  return schemas;
}
