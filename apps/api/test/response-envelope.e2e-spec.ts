import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

describe('Response envelope', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let routeId: string;
  let unitId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configureApp(moduleFixture.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);

    const route = await prisma.route.create({
      data: {
        name: `envelope-${Date.now()}`,
        points: { create: [{ sequence: 0, lat: 18.48, lng: -69.93 }] },
      },
    });
    routeId = route.id;
    const unit = await prisma.unit.create({
      data: { name: `envelope-${Date.now()}` },
    });
    unitId = unit.id;
  });

  afterAll(async () => {
    await prisma.duty.deleteMany({ where: { routeId } });
    await prisma.route.delete({ where: { id: routeId } });
    await prisma.unit.delete({ where: { id: unitId } });
    await app.close();
  });

  describe('success', () => {
    it('wraps a collection in data', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/routes')
        .expect(200);

      expect(Object.keys(body)).toEqual(['data']);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('wraps a single resource in data', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/routes/${routeId}`)
        .expect(200);

      expect(Object.keys(body)).toEqual(['data']);
      expect(body.data.id).toBe(routeId);
    });

    it('wraps a created resource in data', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/duties')
        .send({
          routeId,
          unitId,
          startAt: '2028-04-01T06:00:00.000Z',
          endAt: '2028-04-01T08:00:00.000Z',
        })
        .expect(201);

      expect(Object.keys(body)).toEqual(['data']);
      expect(body.data.unitId).toBe(unitId);
    });

    it('sends no body on delete', async () => {
      const created = await request(app.getHttpServer())
        .post('/duties')
        .send({
          routeId,
          unitId,
          startAt: '2028-05-01T06:00:00.000Z',
          endAt: '2028-05-01T08:00:00.000Z',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .delete(`/duties/${created.body.data.id}`)
        .expect(204);

      expect(response.body).toEqual({});
    });
  });

  describe('failure', () => {
    it('wraps a validation failure with issues', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/routes')
        .send({ points: [] })
        .expect(400);

      expect(Object.keys(body)).toEqual(['error']);
      expect(body.error.code).toBe('ValidationError');
      expect(body.error.message).toEqual(expect.any(String));
      expect(body.error.issues[0]).toEqual({
        path: 'name',
        message: expect.any(String),
      });
    });

    it('wraps a domain validation failure', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/routes')
        .send({ name: '   ', points: [] })
        .expect(400);

      expect(body.error.code).toBe('InvalidRouteError');
      expect(body.error.issues).toBeUndefined();
    });

    it('wraps a not-found failure', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/routes/does-not-exist')
        .expect(404);

      expect(body.error.code).toBe('RouteNotFoundError');
    });

    it('wraps a conflict so the UI can tell the two 409s apart', async () => {
      await request(app.getHttpServer())
        .post('/duties')
        .send({
          routeId,
          unitId,
          startAt: '2028-06-01T06:00:00.000Z',
          endAt: '2028-06-01T08:00:00.000Z',
        })
        .expect(201);

      const overlap = await request(app.getHttpServer())
        .post('/duties')
        .send({
          routeId,
          unitId,
          startAt: '2028-06-01T07:00:00.000Z',
          endAt: '2028-06-01T09:00:00.000Z',
        })
        .expect(409);

      const stillHasDuties = await request(app.getHttpServer())
        .delete(`/routes/${routeId}`)
        .expect(409);

      expect(overlap.body.error.code).toBe('OverlappingDutyError');
      expect(stillHasDuties.body.error.code).toBe('RouteHasDutiesError');
    });

    it('wraps an unmatched path', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/nothing-here')
        .expect(404);

      expect(Object.keys(body)).toEqual(['error']);
      expect(body.error.code).toBe('NotFound');
    });
  });
});
