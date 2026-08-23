import { INestApplication } from '@nestjs/common';
import { DomainExceptionFilter } from './infrastructure/http/domain-exception.filter';

/** Shared by main.ts and the e2e specs so both run the same HTTP stack. */
export function configureApp(app: INestApplication): INestApplication {
  app.useGlobalFilters(new DomainExceptionFilter());
  return app;
}
