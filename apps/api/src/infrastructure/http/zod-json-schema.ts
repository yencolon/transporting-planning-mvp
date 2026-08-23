import { z } from 'zod';

type JsonSchema = Record<string, unknown>;

/**
 * Derives an OpenAPI request body from the same Zod schema that validates it,
 * so docs and validation cannot drift apart.
 */
export function toJsonSchema(schema: z.ZodType): JsonSchema {
  return z.toJSONSchema(schema, {
    io: 'input',
    unrepresentable: 'any',
    override: (ctx) => {
      // z.coerce.date() is not representable in JSON Schema; it parses a string.
      if (ctx.zodSchema._zod.def.type === 'date') {
        ctx.jsonSchema.type = 'string';
        ctx.jsonSchema.format = 'date-time';
      }
    },
  });
}

/** @nestjs/swagger's ApiBody consumes raw JSON Schema without the draft header. */
export function toBodySchema(schema: z.ZodType): JsonSchema {
  const { $schema: _draft, ...body } = toJsonSchema(schema);
  return body;
}
