import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { buildOpenApiDocument } from '../src/infrastructure/http/openapi';

describe('OpenAPI document', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configureApp(moduleFixture.createNestApplication());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('builds without throwing and documents every endpoint', () => {
    const document = buildOpenApiDocument(app);

    expect(Object.keys(document.paths).sort()).toEqual([
      '/duties',
      '/duties/{id}',
      '/routes',
      '/routes/{id}',
      '/units',
      '/units/{id}',
    ]);
  });

  it('derives the duty request body from the Zod schema', () => {
    const document = buildOpenApiDocument(app);
    const schema = (document.paths['/duties'].post as any).requestBody.content[
      'application/json'
    ].schema;

    expect(schema.properties.startAt).toEqual({
      type: 'string',
      format: 'date-time',
    });
    expect(schema.additionalProperties).toBe(false);
    expect(schema.required).toContain('unitId');
  });

  it('marks an unnamed route point as present but nullable', () => {
    const document = buildOpenApiDocument(app);
    const point = document.components!.schemas!.RoutePointResponse as any;

    expect(point.required).toContain('name');
    expect(point.properties.name.nullable).toBe(true);
  });

  it('documents the error body shape for a conflict', () => {
    const document = buildOpenApiDocument(app);
    const conflict = (document.paths['/duties'].post as any).responses['409'];

    expect(conflict.content['application/json'].schema.$ref).toContain(
      'ErrorResponse',
    );
  });

  it('documents every success body as an envelope', () => {
    const document = buildOpenApiDocument(app);
    const list = (document.paths['/routes'].get as any).responses['200'];
    const detail = (document.paths['/routes/{id}'].get as any).responses['200'];

    expect(list.content['application/json'].schema.properties.data.type).toBe(
      'array',
    );
    expect(
      detail.content['application/json'].schema.properties.data.$ref,
    ).toContain('RouteDetailResponse');
  });
});
