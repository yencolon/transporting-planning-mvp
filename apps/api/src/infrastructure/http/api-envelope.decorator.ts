import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ErrorResponse } from './error.response';

interface EnvelopeOptions {
  status: number;
  isArray?: boolean;
  description?: string;
}

/** Documents a success body as `{ data: <model> }`, matching EnvelopeInterceptor. */
export function ApiEnvelopeResponse<T extends Type<unknown>>(
  model: T,
  { status, isArray, description }: EnvelopeOptions,
) {
  const data = isArray
    ? { type: 'array', items: { $ref: getSchemaPath(model) } }
    : { $ref: getSchemaPath(model) };

  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status,
      description,
      schema: { type: 'object', properties: { data }, required: ['data'] },
    }),
  );
}

/** Documents a failure body, which ApiExceptionFilter always shapes the same way. */
export function ApiErrorResponse(status: number, description: string) {
  return applyDecorators(
    ApiResponse({ status, description, type: ErrorResponse }),
  );
}
