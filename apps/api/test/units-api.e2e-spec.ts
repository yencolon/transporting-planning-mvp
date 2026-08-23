import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

describe('Units API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let routeId: string;
  const createdUnitIds: string[] = [];

  const unitName = () => `units-api-${Date.now()}-${Math.random()}`;

  async function createUnit(name = unitName()) {
    const response = await request(app.getHttpServer())
      .post('/units')
      .send({ name })
      .expect(201);
    createdUnitIds.push(response.body.data.id);
    return response.body.data;
  }

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configureApp(moduleFixture.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);

    const route = await prisma.route.create({
      data: { name: `units-api-${Date.now()}` },
    });
    routeId = route.id;
  });

  afterAll(async () => {
    await prisma.duty.deleteMany({ where: { routeId } });
    await prisma.route.delete({ where: { id: routeId } });
    await prisma.unit.deleteMany({ where: { id: { in: createdUnitIds } } });
    await app.close();
  });

  describe('POST /units', () => {
    it('creates a unit', async () => {
      const name = unitName();
      const unit = await createUnit(name);

      expect(unit).toEqual({ id: expect.any(String), name });
    });

    it('trims the name', async () => {
      const name = unitName();
      const unit = await createUnit(`  ${name}  `);

      expect(unit.name).toBe(name);
    });

    it('returns 409 for a duplicate name', async () => {
      const name = unitName();
      await createUnit(name);

      const response = await request(app.getHttpServer())
        .post('/units')
        .send({ name })
        .expect(409);

      expect(response.body.error.code).toBe('DuplicateUnitError');
    });

    it('returns 400 for a blank name', async () => {
      await request(app.getHttpServer())
        .post('/units')
        .send({ name: '   ' })
        .expect(400);
    });
  });

  describe('DELETE /units/:id', () => {
    it('deletes a unit with no duties', async () => {
      const unit = await createUnit();

      await request(app.getHttpServer())
        .delete(`/units/${unit.id}`)
        .expect(204);

      expect(await prisma.unit.findUnique({ where: { id: unit.id } })).toBeNull();
    });

    it('returns 409 while the unit still has duties', async () => {
      const unit = await createUnit();
      await request(app.getHttpServer())
        .post('/duties')
        .send({
          routeId,
          unitId: unit.id,
          startAt: '2029-03-01T06:00:00.000Z',
          endAt: '2029-03-01T08:00:00.000Z',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .delete(`/units/${unit.id}`)
        .expect(409);

      expect(response.body.error.code).toBe('UnitHasDutiesError');
    });

    it('returns 404 for a unit that does not exist', async () => {
      await request(app.getHttpServer())
        .delete('/units/does-not-exist')
        .expect(404);
    });
  });

  describe('GET /units', () => {
    it('lists the created unit', async () => {
      const unit = await createUnit();

      const response = await request(app.getHttpServer())
        .get('/units')
        .expect(200);

      expect(response.body.data).toContainEqual(unit);
    });
  });
});
