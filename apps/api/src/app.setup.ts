import { INestApplication } from '@nestjs/common';
import { ApiExceptionFilter } from './infrastructure/http/api-exception.filter';
import { EnvelopeInterceptor } from './infrastructure/http/envelope.interceptor';

/** Shared by main.ts and the e2e specs so both run the same HTTP stack. */
export function configureApp(app: INestApplication): INestApplication {
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  });
  app.useGlobalInterceptors(new EnvelopeInterceptor());
  app.useGlobalFilters(new ApiExceptionFilter());
  return app;
}
