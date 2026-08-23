import { Injectable } from '@nestjs/common';
import { DutyRepository } from '../../duties/domain/duty.repository';
import { UnitHasDutiesError, UnitNotFoundError } from '../domain/errors';
import { UnitRepository } from '../domain/unit.repository';

@Injectable()
export class DeleteUnit {
  constructor(
    private readonly units: UnitRepository,
    private readonly duties: DutyRepository,
  ) {}

  async execute(id: string): Promise<void> {
    if (!(await this.units.findById(id))) {
      throw new UnitNotFoundError(id);
    }

    const duties = await this.duties.findByUnitId(id);
    if (duties.length > 0) {
      throw new UnitHasDutiesError(id, duties.length);
    }

    await this.units.delete(id);
  }
}
