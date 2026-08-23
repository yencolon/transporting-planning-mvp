import { InMemoryRouteRepository } from '../../../testing/in-memory-repositories';
import { toOrderedPoints } from '../domain/route';
import { UpdateRoute } from './update-route';

describe('UpdateRoute', () => {
  it('renumbers sequence from zero when points are replaced', async () => {
    const routes = new InMemoryRouteRepository();
    const route = await routes.create({
      name: 'Centro - Norte',
      points: toOrderedPoints([
        { lat: 18.48, lng: -69.93 },
        { lat: 18.49, lng: -69.94 },
        { lat: 18.51, lng: -69.95 },
      ]),
    });

    const updated = await new UpdateRoute(routes).execute(route.id, {
      points: [
        { lat: 18.51, lng: -69.95, name: 'Villa Mella' },
        { lat: 18.48, lng: -69.93 },
      ],
    });

    expect(updated.points.map((point) => point.sequence)).toEqual([0, 1]);
    expect(updated.points[0].name).toBe('Villa Mella');
  });
});
