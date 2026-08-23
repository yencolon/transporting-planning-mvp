import { Injectable } from '@nestjs/common';
import { DuplicateUnitError } from '../domain/errors';
import { Unit, toUnitName } from '../domain/unit';
import { UnitRepository } from '../domain/unit.repository';

@Injectable()
export class CreateUnit {
  constructor(private readonly units: UnitRepository) {}

  async execute(name: string): Promise<Unit> {
    const unitName = toUnitName(name);

    if (await this.units.findByName(unitName)) {
      throw new DuplicateUnitError(unitName);
    }

    return this.units.create(unitName);
  }
}
