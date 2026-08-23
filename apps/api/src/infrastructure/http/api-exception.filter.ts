import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import {
  DutyNotFoundError,
  InvalidTimeWindowError,
  OverlappingDutyError,
} from '../../modules/duties/domain/errors';
import {
  InvalidRouteError,
  RouteHasDutiesError,
  RouteNotFoundError,
} from '../../modules/routes/domain/errors';
import {
  DuplicateUnitError,
  InvalidUnitError,
  UnitHasDutiesError,
  UnitNotFoundError,
} from '../../modules/units/domain/errors';
import { ApiErrorIssue } from './error.response';

type DomainErrorClass = new (...args: any[]) => Error;

const STATUS_BY_DOMAIN_ERROR = new Map<DomainErrorClass, HttpStatus>([
  [RouteNotFoundError, HttpStatus.NOT_FOUND],
  [DutyNotFoundError, HttpStatus.NOT_FOUND],
  [UnitNotFoundError, HttpStatus.NOT_FOUND],
  [InvalidRouteError, HttpStatus.BAD_REQUEST],
  [InvalidTimeWindowError, HttpStatus.BAD_REQUEST],
  [InvalidUnitError, HttpStatus.BAD_REQUEST],
  [OverlappingDutyError, HttpStatus.CONFLICT],
  [RouteHasDutiesError, HttpStatus.CONFLICT],
  [DuplicateUnitError, HttpStatus.CONFLICT],
  [UnitHasDutiesError, HttpStatus.CONFLICT],
]);

/**
 * Every failure leaves through here, so clients only ever parse one shape:
 * { error: { code, message, issues? } }.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const { status, code, message, issues } = this.describe(exception);

    host
      .switchToHttp()
      .getResponse<Response>()
      .status(status)
      .json({ error: { code, message, ...(issues ? { issues } : {}) } });
  }

  private describe(exception: unknown): {
    status: HttpStatus;
    code: string;
    message: string;
    issues?: ApiErrorIssue[];
  } {
    const domainStatus =
      exception instanceof Error
        ? STATUS_BY_DOMAIN_ERROR.get(exception.constructor as DomainErrorClass)
        : undefined;

    if (domainStatus && exception instanceof Error) {
      return {
        status: domainStatus,
        code: exception.constructor.name,
        message: exception.message,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      if (isValidationPayload(payload)) {
        return {
          status,
          code: payload.code,
          message: payload.message,
          issues: payload.issues,
        };
      }

      return {
        status,
        code: toPascalCase(HttpStatus[status] ?? 'ERROR'),
        message: extractMessage(payload) ?? exception.message,
      };
    }

    this.logger.error('Unhandled exception', exception as Error);
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'InternalServerError',
      message: 'Internal server error',
    };
  }
}

interface ValidationPayload {
  code: 'ValidationError';
  message: string;
  issues: ApiErrorIssue[];
}

function isValidationPayload(payload: unknown): payload is ValidationPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    (payload as { code?: unknown }).code === 'ValidationError'
  );
}

function extractMessage(payload: unknown): string | undefined {
  if (typeof payload === 'string') {
    return payload;
  }
  const message = (payload as { message?: unknown } | null)?.message;
  if (typeof message === 'string') {
    return message;
  }
  return Array.isArray(message) ? message.join(', ') : undefined;
}

/** NOT_FOUND -> NotFound, so codes read the same as the domain error names. */
function toPascalCase(constant: string): string {
  return constant
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}
