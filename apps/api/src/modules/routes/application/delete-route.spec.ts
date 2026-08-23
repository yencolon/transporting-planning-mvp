import { TimeWindow } from '../../duties/domain/time-window';
import {
  InMemoryDutyRepository,
  InMemoryRouteRepository,
} from '../../../testing/in-memory-repositories';
import { RouteHasDutiesError } from '../domain/errors';
import { DeleteRoute } from './delete-route';

describe('DeleteRoute', () => {
  it('refuses to delete a route that still has duties', async () => {
    const routes = new InMemoryRouteRepository();
    const duties = new InMemoryDutyRepository();
    const route = await routes.create({ name: 'Malecon', points: [] });
    await duties.create({
      routeId: route.id,
      unitId: 'unit-x',
      window: TimeWindow.create(
        new Date('2026-08-24T06:00:00Z'),
        new Date('2026-08-24T08:00:00Z'),
      ),
    });

    await expect(
      new DeleteRoute(routes, duties).execute(route.id),
    ).rejects.toBeInstanceOf(RouteHasDutiesError);
  });

  it('deletes a route with no duties', async () => {
    const routes = new InMemoryRouteRepository();
    const duties = new InMemoryDutyRepository();
    const route = await routes.create({ name: 'Malecon', points: [] });

    await new DeleteRoute(routes, duties).execute(route.id);

    expect(await routes.findById(route.id)).toBeNull();
  });
});
