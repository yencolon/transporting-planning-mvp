import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { CreateRoute } from '../src/modules/routes/application/create-route';
import { GetRouteDetail } from '../src/modules/routes/application/get-route-detail';
import { UpdateRoute } from '../src/modules/routes/application/update-route';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

describe('Route persistence', () => {
  let app: TestingModule;
  let prisma: PrismaService;
  let createRoute: CreateRoute;
  let updateRoute: UpdateRoute;
  let routeDetail: GetRouteDetail;
  const created: string[] = [];

  const newRoute = () =>
    createRoute.execute({
      name: `persistence-${Date.now()}-${Math.random()}`,
      points: [
        { lat: 18.48, lng: -69.93, name: 'A' },
        { lat: 18.49, lng: -69.94, name: 'B' },
        { lat: 18.51, lng: -69.95, name: 'C' },
      ],
    });

  beforeAll(async () => {
    app = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await app.init();
    prisma = app.get(PrismaService);
    createRoute = app.get(CreateRoute);
    updateRoute = app.get(UpdateRoute);
    routeDetail = app.get(GetRouteDetail);
  });

  afterAll(async () => {
    await prisma.route.deleteMany({ where: { id: { in: created } } });
    await app.close();
  });

  it('reads points back in sequence order', async () => {
    const route = await newRoute();
    created.push(route.id);

    const detail = await routeDetail.execute(route.id);

    expect(detail.route.points.map((point) => point.name)).toEqual([
      'A',
      'B',
      'C',
    ]);
  });

  it('keeps the points when only the name changes', async () => {
    const route = await newRoute();
    created.push(route.id);

    const renamed = await updateRoute.execute(route.id, { name: 'Renamed' });

    expect(renamed.name).toBe('Renamed');
    expect(renamed.points).toHaveLength(3);
  });

  it('replaces the point rows instead of appending to them', async () => {
    const route = await newRoute();
    created.push(route.id);

    const updated = await updateRoute.execute(route.id, {
      points: [{ lat: 18.51, lng: -69.95, name: 'C' }],
    });

    expect(updated.points.map((point) => point.sequence)).toEqual([0]);
    expect(await prisma.routePoint.count({ where: { routeId: route.id } })).toBe(
      1,
    );
  });

  it('clears the points when an empty list is sent', async () => {
    const route = await newRoute();
    created.push(route.id);

    const updated = await updateRoute.execute(route.id, { points: [] });

    expect(updated.points).toEqual([]);
    expect(await prisma.routePoint.count({ where: { routeId: route.id } })).toBe(
      0,
    );
  });
});
