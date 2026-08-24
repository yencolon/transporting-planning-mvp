import { INestApplication } from '@nestjs/common';
import { ApiExceptionFilter } from './infrastructure/http/api-exception.filter';
import { EnvelopeInterceptor } from './infrastructure/http/envelope.interceptor';

const DEFAULT_ORIGIN = 'http://localhost:5173';

/**
 * WEB_ORIGIN accepts a comma-separated list, so el front local y el desplegado
 * pueden convivir. Una entrada que empieza por `*.` valida cualquier subdominio,
 * necesario para las URL de preview de Vercel, que cambian en cada despliegue.
 *
 *   WEB_ORIGIN="http://localhost:5173,https://mi-app.vercel.app"
 *   WEB_ORIGIN="https://mi-app.vercel.app,*.vercel.app"
 */
function allowedOrigin(origin: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (!pattern.startsWith('*.')) {
      return pattern === origin;
    }
    try {
      return new URL(origin).hostname.endsWith(pattern.slice(1));
    } catch {
      return false;
    }
  });
}

/** Shared by main.ts and the e2e specs so both run the same HTTP stack. */
export function configureApp(app: INestApplication): INestApplication {
  const patterns = (process.env.WEB_ORIGIN ?? DEFAULT_ORIGIN)
    .split(',')
    .map((pattern) => pattern.trim())
    .filter(Boolean);

  app.enableCors({
    // Sin cabecera Origin no hay navegador de por medio: curl, health checks,
    // el propio Swagger. No es una petición cross-origin que haya que frenar.
    origin: (origin, callback) =>
      callback(null, !origin || allowedOrigin(origin, patterns)),
  });
  app.useGlobalInterceptors(new EnvelopeInterceptor());
  app.useGlobalFilters(new ApiExceptionFilter());
  return app;
}
