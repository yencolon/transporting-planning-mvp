import { TimeWindow } from '../../duties/domain/time-window';
import {
  InMemoryDutyRepository,
  InMemoryUnitRepository,
} from '../../../testing/in-memory-repositories';
import { UnitHasDutiesError, UnitNotFoundError } from '../domain/errors';
import { DeleteUnit } from './delete-unit';

const window = TimeWindow.create(
  new Date('2026-08-24T06:00:00Z'),
  new Date('2026-08-24T08:00:00Z'),
);

describe('DeleteUnit', () => {
  it('deletes a unit with no duties', async () => {
    const units = new InMemoryUnitRepository();
    const duties = new InMemoryDutyRepository();
    const unit = await units.create('BUS-014');

    await new DeleteUnit(units, duties).execute(unit.id);

    expect(await units.findById(unit.id)).toBeNull();
  });

  it('refuses to delete a unit that still has duties', async () => {
    const units = new InMemoryUnitRepository();
    const duties = new InMemoryDutyRepository();
    const unit = await units.create('BUS-014');
    await duties.create({ routeId: 'r1', unitId: unit.id, window });

    await expect(
      new DeleteUnit(units, duties).execute(unit.id),
    ).rejects.toBeInstanceOf(UnitHasDutiesError);
  });

  it('rejects a unit that does not exist', async () => {
    await expect(
      new DeleteUnit(
        new InMemoryUnitRepository(),
        new InMemoryDutyRepository(),
      ).execute('missing-unit'),
    ).rejects.toBeInstanceOf(UnitNotFoundError);
  });
});
