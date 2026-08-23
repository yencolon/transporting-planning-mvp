import {
  InMemoryDutyRepository,
  InMemoryRouteRepository,
  InMemoryUnitRepository,
} from '../../../testing/in-memory-repositories';
import { DutyNotFoundError, OverlappingDutyError } from '../domain/errors';
import { AssignDuty } from './assign-duty';
import { RescheduleDuty } from './reschedule-duty';

const at = (hour: string) => new Date(`2026-08-24T${hour}:00:00Z`);

async function setup() {
  const duties = new InMemoryDutyRepository();
  const routes = new InMemoryRouteRepository();
  const units = new InMemoryUnitRepository();
  const route = await routes.create({ name: 'Malecon', points: [] });
  const busA = units.add('BUS-014');
  const busB = units.add('BUS-027');

  return {
    assign: new AssignDuty(duties, routes, units),
    reschedule: new RescheduleDuty(duties, units),
    routeId: route.id,
    busA,
    busB,
  };
}

describe('RescheduleDuty', () => {
  it('does not treat the duty being moved as its own conflict', async () => {
    const { assign, reschedule, routeId, busA } = await setup();
    const duty = await assign.execute({
      routeId,
      unitId: busA.id,
      startAt: at('06'),
      endAt: at('08'),
    });

    const moved = await reschedule.execute(duty.id, { endAt: at('09') });

    expect(moved.window.endAt).toEqual(at('09'));
  });

  it('rejects a move onto another duty of the same unit', async () => {
    const { assign, reschedule, routeId, busA } = await setup();
    await assign.execute({
      routeId,
      unitId: busA.id,
      startAt: at('06'),
      endAt: at('08'),
    });
    const later = await assign.execute({
      routeId,
      unitId: busA.id,
      startAt: at('10'),
      endAt: at('12'),
    });

    await expect(
      reschedule.execute(later.id, { startAt: at('07'), endAt: at('09') }),
    ).rejects.toBeInstanceOf(OverlappingDutyError);
  });

  it('rejects a move to a unit already busy in that window', async () => {
    const { assign, reschedule, routeId, busA, busB } = await setup();
    await assign.execute({
      routeId,
      unitId: busB.id,
      startAt: at('06'),
      endAt: at('08'),
    });
    const duty = await assign.execute({
      routeId,
      unitId: busA.id,
      startAt: at('06'),
      endAt: at('08'),
    });

    await expect(
      reschedule.execute(duty.id, { unitId: busB.id }),
    ).rejects.toBeInstanceOf(OverlappingDutyError);
  });

  it('rejects rescheduling a duty that does not exist', async () => {
    const { reschedule } = await setup();

    await expect(
      reschedule.execute('missing-duty', { endAt: at('09') }),
    ).rejects.toBeInstanceOf(DutyNotFoundError);
  });
});
