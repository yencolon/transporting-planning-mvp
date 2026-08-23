import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodType } from 'zod';

/** Nest's ValidationPipe only speaks class-validator, so schemas get their own pipe. */
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      // ApiExceptionFilter recognises this payload and keeps the issues.
      throw new BadRequestException({
        code: 'ValidationError',
        message: 'Validation failed',
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    return result.data;
  }
}
