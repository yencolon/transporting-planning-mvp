import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

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
