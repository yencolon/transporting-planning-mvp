import { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  OpenAPIObject,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';

/** Pinned to the version @nestjs/swagger ships, so el CDN y el generador coinciden. */
const SWAGGER_UI = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2';

/**
 * Swagger UI normalmente se sirve como estático desde el propio Nest. En un
 * despliegue serverless esos archivos no llegan al navegador y la página carga
 * con `SwaggerUIBundle is not defined`. Cargarlos desde un CDN funciona igual
 * en local y en producción, sin depender del servidor de estáticos.
 */
export const swaggerUiOptions: SwaggerCustomOptions = {
  customSiteTitle: 'Lawawa API',
  customCssUrl: `${SWAGGER_UI}/swagger-ui.css`,
  customJs: [
    `${SWAGGER_UI}/swagger-ui-bundle.js`,
    `${SWAGGER_UI}/swagger-ui-standalone-preset.js`,
  ],
};

/**
 * Shared by main.ts and the docs spec, so a schema the generator cannot
 * represent fails a test instead of killing bootstrap.
 */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  return SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Lawawa API')
      .setDescription('Routes, units and duty scheduling')
      .setVersion('1.0')
      .build(),
  );
}
