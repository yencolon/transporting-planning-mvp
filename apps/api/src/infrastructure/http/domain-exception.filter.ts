import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
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
import { UnitNotFoundError } from '../../modules/units/domain/errors';

type DomainErrorClass = new (...args: any[]) => Error;

const STATUS_BY_ERROR = new Map<DomainErrorClass, HttpStatus>([
  [RouteNotFoundError, HttpStatus.NOT_FOUND],
  [DutyNotFoundError, HttpStatus.NOT_FOUND],
  [UnitNotFoundError, HttpStatus.NOT_FOUND],
  [InvalidRouteError, HttpStatus.BAD_REQUEST],
  [InvalidTimeWindowError, HttpStatus.BAD_REQUEST],
  [OverlappingDutyError, HttpStatus.CONFLICT],
  [RouteHasDutiesError, HttpStatus.CONFLICT],
]);

/**
 * Translates domain errors into HTTP responses so use cases stay unaware of HTTP.
 * Anything not listed here is not a domain error and is left to Nest.
 */
@Catch(...STATUS_BY_ERROR.keys())
export class DomainExceptionFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost) {
    const status =
      STATUS_BY_ERROR.get(error.constructor as DomainErrorClass) ??
      HttpStatus.INTERNAL_SERVER_ERROR;

    host.switchToHttp().getResponse<Response>().status(status).json({
      statusCode: status,
      error: error.constructor.name,
      message: error.message,
    });
  }
}
