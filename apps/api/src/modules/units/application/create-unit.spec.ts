import { InMemoryUnitRepository } from '../../../testing/in-memory-repositories';
import { DuplicateUnitError, InvalidUnitError } from '../domain/errors';
import { CreateUnit } from './create-unit';

describe('CreateUnit', () => {
  it('creates a unit with a trimmed name', async () => {
    const units = new InMemoryUnitRepository();

    const unit = await new CreateUnit(units).execute('  BUS-014  ');

    expect(unit.name).toBe('BUS-014');
  });

  it('rejects a duplicate name', async () => {
    const units = new InMemoryUnitRepository();
    const create = new CreateUnit(units);
    await create.execute('BUS-014');

    await expect(create.execute('BUS-014')).rejects.toBeInstanceOf(
      DuplicateUnitError,
    );
  });

  it('rejects a blank name', async () => {
    const units = new InMemoryUnitRepository();

    await expect(new CreateUnit(units).execute('   ')).rejects.toBeInstanceOf(
      InvalidUnitError,
    );
  });
});
