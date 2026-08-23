import { TimeWindow } from '../../duties/domain/time-window';
import {
  InMemoryDutyRepository,
  InMemoryRouteRepository,
} from '../../../testing/in-memory-repositories';
import { RouteNotFoundError } from '../domain/errors';
import { GetRouteDetail } from './get-route-detail';

const window = (from: string, to: string) =>
  TimeWindow.create(
    new Date(`2026-08-24T${from}:00:00Z`),
    new Date(`2026-08-24T${to}:00:00Z`),
  );

describe('GetRouteDetail', () => {
  it('returns only the duties belonging to the requested route', async () => {
    const routes = new InMemoryRouteRepository();
    const duties = new InMemoryDutyRepository();
    const wanted = await routes.create({ name: 'Centro - Norte', points: [] });
    const other = await routes.create({ name: 'Malecon', points: [] });

    await duties.create({
      routeId: wanted.id,
      unitId: 'bus-a',
      window: window('06', '08'),
    });
    await duties.create({
      routeId: other.id,
      unitId: 'bus-b',
      window: window('06', '08'),
    });

    const detail = await new GetRouteDetail(routes, duties).execute(wanted.id);

    expect(detail.route.name).toBe('Centro - Norte');
    expect(detail.duties).toHaveLength(1);
    expect(detail.duties[0].routeId).toBe(wanted.id);
  });

  it('rejects a route that does not exist', async () => {
    const detail = new GetRouteDetail(
      new InMemoryRouteRepository(),
      new InMemoryDutyRepository(),
    );

    await expect(detail.execute('missing-route')).rejects.toBeInstanceOf(
      RouteNotFoundError,
    );
  });
});
