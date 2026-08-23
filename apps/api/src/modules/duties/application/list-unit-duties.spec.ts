import { InMemoryDutyRepository } from '../../../testing/in-memory-repositories';
import { TimeWindow } from '../domain/time-window';
import { ListUnitDuties } from './list-unit-duties';

const at = (day: string, hour: string) =>
  new Date(`2026-08-${day}T${hour}:00:00Z`);

const window = (day: string, from: string, to: string) =>
  TimeWindow.create(at(day, from), at(day, to));

async function setup() {
  const duties = new InMemoryDutyRepository();
  await duties.create({
    routeId: 'r1',
    unitId: 'bus-a',
    window: window('24', '06', '08'),
  });
  await duties.create({
    routeId: 'r1',
    unitId: 'bus-a',
    window: window('25', '06', '08'),
  });
  await duties.create({
    routeId: 'r1',
    unitId: 'bus-b',
    window: window('24', '06', '08'),
  });

  return { duties, list: new ListUnitDuties(duties) };
}

describe('ListUnitDuties', () => {
  it('returns every duty of the unit when no range is given', async () => {
    const { list } = await setup();

    const found = await list.execute({ unitId: 'bus-a' });

    expect(found).toHaveLength(2);
  });

  it('never returns another unit’s duties', async () => {
    const { list } = await setup();

    const found = await list.execute({ unitId: 'bus-a' });

    expect(found.every((duty) => duty.unitId === 'bus-a')).toBe(true);
  });

  it('narrows to the requested day', async () => {
    const { list } = await setup();

    const found = await list.execute({
      unitId: 'bus-a',
      from: at('24', '00'),
      to: at('25', '00'),
    });

    expect(found).toHaveLength(1);
    expect(found[0].window.startAt).toEqual(at('24', '06'));
  });

  it('excludes a duty that merely touches the range bound', async () => {
    const { list } = await setup();

    const found = await list.execute({
      unitId: 'bus-a',
      from: at('24', '08'),
      to: at('24', '12'),
    });

    expect(found).toEqual([]);
  });
});
