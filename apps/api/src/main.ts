import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { buildOpenApiDocument } from './infrastructure/http/openapi';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));

  SwaggerModule.setup('docs', app, buildOpenApiDocument(app));

  await app.listen(3000);
}
bootstrap();
