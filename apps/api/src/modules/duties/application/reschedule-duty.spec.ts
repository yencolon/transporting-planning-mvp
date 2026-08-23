import {
  InMemoryDutyRepository,
  InMemoryRouteRepository,
  InMemoryUnitRepository,
} from '../../../testing/in-memory-repositories';
import { AssignDuty } from './assign-duty';
import { RescheduleDuty } from './reschedule-duty';

const at = (hour: string) => new Date(`2026-08-24T${hour}:00:00Z`);

describe('RescheduleDuty', () => {
  it('does not treat the duty being moved as its own conflict', async () => {
    const duties = new InMemoryDutyRepository();
    const routes = new InMemoryRouteRepository();
    const units = new InMemoryUnitRepository();
    const route = await routes.create({ name: 'Malecon', points: [] });
    const bus = units.add('BUS-014');

    const duty = await new AssignDuty(duties, routes, units).execute({
      routeId: route.id,
      unitId: bus.id,
      startAt: at('06'),
      endAt: at('08'),
    });

    const moved = await new RescheduleDuty(duties, units).execute(duty.id, {
      endAt: at('09'),
    });

    expect(moved.window.endAt).toEqual(at('09'));
  });
});
