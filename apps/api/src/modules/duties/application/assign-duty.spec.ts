import {
  InMemoryDutyRepository,
  InMemoryRouteRepository,
  InMemoryUnitRepository,
} from '../../../testing/in-memory-repositories';
import { RouteNotFoundError } from '../../routes/domain/errors';
import { UnitNotFoundError } from '../../units/domain/errors';
import { InvalidTimeWindowError, OverlappingDutyError } from '../domain/errors';
import { AssignDuty } from './assign-duty';

const at = (hour: string) => new Date(`2026-08-24T${hour}:00:00Z`);

async function setup() {
  const duties = new InMemoryDutyRepository();
  const routes = new InMemoryRouteRepository();
  const units = new InMemoryUnitRepository();

  const route = await routes.create({ name: 'Centro - Norte', points: [] });
  const busA = units.add('BUS-014');
  const busB = units.add('BUS-027');

  return {
    assign: new AssignDuty(duties, routes, units),
    routeId: route.id,
    busA,
    busB,
  };
}

describe('AssignDuty', () => {
  it('rejects a window overlapping another duty on the same unit', async () => {
    const { assign, routeId, busA } = await setup();
    await assign.execute({
      routeId,
      unitId: busA.id,
      startAt: at('06'),
      endAt: at('08'),
    });

    await expect(
      assign.execute({
        routeId,
        unitId: busA.id,
        startAt: at('07'),
        endAt: at('09'),
      }),
    ).rejects.toBeInstanceOf(OverlappingDutyError);
  });

  it('accepts a window starting exactly when the previous one ends', async () => {
    const { assign, routeId, busA } = await setup();
    await assign.execute({
      routeId,
      unitId: busA.id,
      startAt: at('06'),
      endAt: at('08'),
    });

    const backToBack = await assign.execute({
      routeId,
      unitId: busA.id,
      startAt: at('08'),
      endAt: at('10'),
    });

    expect(backToBack.window.startAt).toEqual(at('08'));
  });

  it('accepts the same window on a different unit', async () => {
    const { assign, routeId, busA, busB } = await setup();
    await assign.execute({
      routeId,
      unitId: busA.id,
      startAt: at('06'),
      endAt: at('08'),
    });

    const other = await assign.execute({
      routeId,
      unitId: busB.id,
      startAt: at('06'),
      endAt: at('08'),
    });

    expect(other.unitId).toBe(busB.id);
  });

  it('rejects a window that fully contains an existing duty', async () => {
    const { assign, routeId, busA } = await setup();
    await assign.execute({
      routeId,
      unitId: busA.id,
      startAt: at('08'),
      endAt: at('09'),
    });

    await expect(
      assign.execute({
        routeId,
        unitId: busA.id,
        startAt: at('06'),
        endAt: at('12'),
      }),
    ).rejects.toBeInstanceOf(OverlappingDutyError);
  });

  it('rejects a window that falls entirely inside an existing duty', async () => {
    const { assign, routeId, busA } = await setup();
    await assign.execute({
      routeId,
      unitId: busA.id,
      startAt: at('06'),
      endAt: at('12'),
    });

    await expect(
      assign.execute({
        routeId,
        unitId: busA.id,
        startAt: at('08'),
        endAt: at('09'),
      }),
    ).rejects.toBeInstanceOf(OverlappingDutyError);
  });

  it('accepts a window ending exactly when the next one starts', async () => {
    const { assign, routeId, busA } = await setup();
    await assign.execute({
      routeId,
      unitId: busA.id,
      startAt: at('08'),
      endAt: at('10'),
    });

    const earlier = await assign.execute({
      routeId,
      unitId: busA.id,
      startAt: at('06'),
      endAt: at('08'),
    });

    expect(earlier.window.endAt).toEqual(at('08'));
  });

  it('rejects a duty for a route that does not exist', async () => {
    const { assign, busA } = await setup();

    await expect(
      assign.execute({
        routeId: 'missing-route',
        unitId: busA.id,
        startAt: at('06'),
        endAt: at('08'),
      }),
    ).rejects.toBeInstanceOf(RouteNotFoundError);
  });

  it('rejects a duty for a unit that does not exist', async () => {
    const { assign, routeId } = await setup();

    await expect(
      assign.execute({
        routeId,
        unitId: 'missing-unit',
        startAt: at('06'),
        endAt: at('08'),
      }),
    ).rejects.toBeInstanceOf(UnitNotFoundError);
  });

  it('rejects a window that ends before it starts', async () => {
    const { assign, routeId, busA } = await setup();

    await expect(
      assign.execute({
        routeId,
        unitId: busA.id,
        startAt: at('10'),
        endAt: at('08'),
      }),
    ).rejects.toBeInstanceOf(InvalidTimeWindowError);
  });
});
