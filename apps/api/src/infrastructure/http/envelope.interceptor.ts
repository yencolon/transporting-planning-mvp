import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface Envelope<T> {
  data: T;
}

/** Every response body is `{ data }`. Handlers keep returning plain values. */
export class EnvelopeInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<Envelope<unknown> | undefined> {
    return next
      .handle()
      .pipe(map((data) => (data === undefined ? undefined : { data })));
  }
}
