import { InMemoryRouteRepository } from '../../../testing/in-memory-repositories';
import { InvalidRouteError } from '../domain/errors';
import { CreateRoute } from './create-route';

const createRoute = () => new CreateRoute(new InMemoryRouteRepository());

describe('CreateRoute', () => {
  it('numbers points by their position in the list', async () => {
    const route = await createRoute().execute({
      name: 'Centro - Norte',
      points: [
        { lat: 18.48, lng: -69.93 },
        { lat: 18.49, lng: -69.94 },
        { lat: 18.51, lng: -69.95 },
      ],
    });

    expect(route.points.map((point) => point.sequence)).toEqual([0, 1, 2]);
  });

  it('keeps a point name and normalises a blank one to null', async () => {
    const route = await createRoute().execute({
      name: 'Centro - Norte',
      points: [
        { lat: 18.48, lng: -69.93, name: '  Parque Independencia  ' },
        { lat: 18.49, lng: -69.94, name: '   ' },
      ],
    });

    expect(route.points[0].name).toBe('Parque Independencia');
    expect(route.points[1].name).toBeNull();
  });

  it('rejects a blank route name', async () => {
    await expect(
      createRoute().execute({ name: '   ', points: [] }),
    ).rejects.toBeInstanceOf(InvalidRouteError);
  });

  it('rejects an out-of-range latitude', async () => {
    await expect(
      createRoute().execute({
        name: 'Centro - Norte',
        points: [{ lat: 91, lng: -69.93 }],
      }),
    ).rejects.toBeInstanceOf(InvalidRouteError);
  });

  it('rejects an out-of-range longitude', async () => {
    await expect(
      createRoute().execute({
        name: 'Centro - Norte',
        points: [{ lat: 18.48, lng: -181 }],
      }),
    ).rejects.toBeInstanceOf(InvalidRouteError);
  });
});
