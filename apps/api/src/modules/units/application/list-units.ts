import { Injectable } from '@nestjs/common';
import { Unit } from '../domain/unit';
import { UnitRepository } from '../domain/unit.repository';

@Injectable()
export class ListUnits {
  constructor(private readonly units: UnitRepository) {}

  execute(): Promise<Unit[]> {
    return this.units.list();
  }
}
