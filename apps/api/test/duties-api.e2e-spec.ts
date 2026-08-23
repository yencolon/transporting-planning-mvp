import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

const at = (hour: string) => `2027-11-03T${hour}:00:00.000Z`;

describe('Duties API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let routeId: string;
  let unitId: string;
  let otherUnitId: string;

  const assign = (body: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/duties').send(body);

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = configureApp(moduleFixture.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);

    const route = await prisma.route.create({
      data: { name: `duties-api-${Date.now()}` },
    });
    routeId = route.id;

    // Own fixtures only: other specs create and delete units in parallel.
    const first = await prisma.unit.create({
      data: { name: `duties-api-a-${Date.now()}` },
    });
    const second = await prisma.unit.create({
      data: { name: `duties-api-b-${Date.now()}` },
    });
    unitId = first.id;
    otherUnitId = second.id;
  });

  beforeEach(async () => {
    await prisma.duty.deleteMany({ where: { routeId } });
  });

  afterAll(async () => {
    await prisma.duty.deleteMany({ where: { routeId } });
    await prisma.route.delete({ where: { id: routeId } });
    await prisma.unit.deleteMany({
      where: { id: { in: [unitId, otherUnitId] } },
    });
    await app.close();
  });

  describe('POST /duties', () => {
    it('assigns a duty', async () => {
      const response = await assign({
        routeId,
        unitId,
        startAt: at('06'),
        endAt: at('08'),
      }).expect(201);

      expect(response.body.data).toMatchObject({
        routeId,
        unitId,
        startAt: at('06'),
        endAt: at('08'),
      });
    });

    it('returns 409 when the unit is already busy', async () => {
      await assign({
        routeId,
        unitId,
        startAt: at('06'),
        endAt: at('08'),
      }).expect(201);

      await assign({
        routeId,
        unitId,
        startAt: at('07'),
        endAt: at('09'),
      }).expect(409);
    });

    it('accepts a back-to-back window on the same unit', async () => {
      await assign({
        routeId,
        unitId,
        startAt: at('06'),
        endAt: at('08'),
      }).expect(201);

      await assign({
        routeId,
        unitId,
        startAt: at('08'),
        endAt: at('10'),
      }).expect(201);
    });

    it('accepts the same window on another unit', async () => {
      await assign({
        routeId,
        unitId,
        startAt: at('06'),
        endAt: at('08'),
      }).expect(201);

      await assign({
        routeId,
        unitId: otherUnitId,
        startAt: at('06'),
        endAt: at('08'),
      }).expect(201);
    });

    it('returns 404 for an unknown route', async () => {
      await assign({
        routeId: 'does-not-exist',
        unitId,
        startAt: at('06'),
        endAt: at('08'),
      }).expect(404);
    });

    it('returns 404 for an unknown unit', async () => {
      await assign({
        routeId,
        unitId: 'does-not-exist',
        startAt: at('06'),
        endAt: at('08'),
      }).expect(404);
    });

    it('returns 400 when the window ends before it starts', async () => {
      await assign({
        routeId,
        unitId,
        startAt: at('10'),
        endAt: at('08'),
      }).expect(400);
    });

    it('returns 400 when a date is not a date', async () => {
      await assign({
        routeId,
        unitId,
        startAt: 'yesterday',
        endAt: at('08'),
      }).expect(400);
    });
  });

  describe('PATCH /duties/:id', () => {
    it('reschedules a duty', async () => {
      const created = await assign({
        routeId,
        unitId,
        startAt: at('06'),
        endAt: at('08'),
      }).expect(201);

      const response = await request(app.getHttpServer())
        .patch(`/duties/${created.body.data.id}`)
        .send({ endAt: at('09') })
        .expect(200);

      expect(response.body.data.endAt).toBe(at('09'));
    });

    it('returns 409 when the new window collides with another duty', async () => {
      await assign({
        routeId,
        unitId,
        startAt: at('06'),
        endAt: at('08'),
      }).expect(201);
      const later = await assign({
        routeId,
        unitId,
        startAt: at('10'),
        endAt: at('12'),
      }).expect(201);

      await request(app.getHttpServer())
        .patch(`/duties/${later.body.data.id}`)
        .send({ startAt: at('07'), endAt: at('09') })
        .expect(409);
    });

    it('returns 404 for a duty that does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/duties/does-not-exist')
        .send({ endAt: at('09') })
        .expect(404);
    });
  });

  describe('DELETE /duties/:id', () => {
    it('deletes a duty', async () => {
      const created = await assign({
        routeId,
        unitId,
        startAt: at('06'),
        endAt: at('08'),
      }).expect(201);

      await request(app.getHttpServer())
        .delete(`/duties/${created.body.data.id}`)
        .expect(204);

      expect(await prisma.duty.count({ where: { routeId } })).toBe(0);
    });

    it('returns 404 for a duty that does not exist', async () => {
      await request(app.getHttpServer())
        .delete('/duties/does-not-exist')
        .expect(404);
    });
  });

  describe('GET /units', () => {
    it('lists the units', async () => {
      const response = await request(app.getHttpServer())
        .get('/units')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toEqual({
        id: expect.any(String),
        name: expect.any(String),
      });
    });
  });
});
