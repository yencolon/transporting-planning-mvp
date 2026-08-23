import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

describe('Routes API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let unitId: string;
  const routeIds: string[] = [];

  const newRoutePayload = () => ({
    name: `api-route-${Date.now()}-${Math.random()}`,
    points: [
      { lat: 18.4861, lng: -69.9312, name: 'Parque Independencia' },
      { lat: 18.4955, lng: -69.9401 },
      { lat: 18.5104, lng: -69.9498, name: 'Villa Mella' },
    ],
  });

  async function createRoute() {
    const response = await request(app.getHttpServer())
      .post('/routes')
      .send(newRoutePayload())
      .expect(201);
    routeIds.push(response.body.data.id);
    return response.body.data;
  }

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = configureApp(moduleFixture.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);

    // Own fixtures only: other specs create and delete units in parallel.
    const unit = await prisma.unit.create({
      data: { name: `routes-api-${Date.now()}` },
    });
    unitId = unit.id;
  });

  afterAll(async () => {
    await prisma.duty.deleteMany({ where: { routeId: { in: routeIds } } });
    await prisma.route.deleteMany({ where: { id: { in: routeIds } } });
    await prisma.unit.delete({ where: { id: unitId } });
    await app.close();
  });

  describe('POST /routes', () => {
    it('creates a route and numbers its points', async () => {
      const route = await createRoute();

      expect(route.id).toEqual(expect.any(String));
      expect(route.points.map((p: { sequence: number }) => p.sequence)).toEqual(
        [0, 1, 2],
      );
      expect(route.points[1].name).toBeNull();
    });

    it('rejects a blank name', async () => {
      await request(app.getHttpServer())
        .post('/routes')
        .send({ name: '   ', points: [] })
        .expect(400);
    });

    it('rejects a missing name', async () => {
      await request(app.getHttpServer())
        .post('/routes')
        .send({ points: [] })
        .expect(400);
    });

    it('rejects an out-of-range latitude', async () => {
      await request(app.getHttpServer())
        .post('/routes')
        .send({ name: 'Bad route', points: [{ lat: 91, lng: -69.93 }] })
        .expect(400);
    });
  });

  describe('GET /routes', () => {
    it('lists routes with their point count', async () => {
      const route = await createRoute();

      const response = await request(app.getHttpServer())
        .get('/routes')
        .expect(200);

      expect(response.body.data).toContainEqual({
        id: route.id,
        name: route.name,
        pointCount: 3,
      });
    });
  });

  describe('GET /routes/:id', () => {
    it('returns the points in order and the duties on that route', async () => {
      const route = await createRoute();

      const response = await request(app.getHttpServer())
        .get(`/routes/${route.id}`)
        .expect(200);

      expect(
        response.body.data.points.map((p: { sequence: number }) => p.sequence),
      ).toEqual([0, 1, 2]);
      expect(response.body.data.duties).toEqual([]);
    });

    it('returns 404 for a route that does not exist', async () => {
      await request(app.getHttpServer())
        .get('/routes/does-not-exist')
        .expect(404);
    });
  });

  describe('PATCH /routes/:id', () => {
    it('renames a route without touching its points', async () => {
      const route = await createRoute();

      const response = await request(app.getHttpServer())
        .patch(`/routes/${route.id}`)
        .send({ name: 'Renamed route' })
        .expect(200);

      expect(response.body.data.name).toBe('Renamed route');
      expect(response.body.data.points).toHaveLength(3);
    });

    it('replaces the points when a new list is sent', async () => {
      const route = await createRoute();

      const response = await request(app.getHttpServer())
        .patch(`/routes/${route.id}`)
        .send({ points: [{ lat: 18.51, lng: -69.95, name: 'Only stop' }] })
        .expect(200);

      expect(response.body.data.points).toHaveLength(1);
      expect(response.body.data.points[0].sequence).toBe(0);
    });

    it('returns 404 for a route that does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/routes/does-not-exist')
        .send({ name: 'Whatever' })
        .expect(404);
    });
  });

  describe('DELETE /routes/:id', () => {
    it('deletes a route with no duties', async () => {
      const route = await createRoute();

      await request(app.getHttpServer())
        .delete(`/routes/${route.id}`)
        .expect(204);

      await request(app.getHttpServer()).get(`/routes/${route.id}`).expect(404);
    });

    it('refuses with 409 while duties are still assigned', async () => {
      const route = await createRoute();

      await request(app.getHttpServer())
        .post('/duties')
        .send({
          routeId: route.id,
          unitId,
          startAt: '2027-09-01T06:00:00.000Z',
          endAt: '2027-09-01T08:00:00.000Z',
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/routes/${route.id}`)
        .expect(409);
    });
  });
});
