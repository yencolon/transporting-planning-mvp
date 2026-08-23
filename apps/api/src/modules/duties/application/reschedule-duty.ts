import { Injectable } from '@nestjs/common';
import { UnitNotFoundError } from '../../units/domain/errors';
import { UnitRepository } from '../../units/domain/unit.repository';
import { Duty } from '../domain/duty';
import { DutyRepository } from '../domain/duty.repository';
import { DutyNotFoundError, OverlappingDutyError } from '../domain/errors';
import { TimeWindow } from '../domain/time-window';

export interface RescheduleDutyInput {
  unitId?: string;
  startAt?: Date;
  endAt?: Date;
}

@Injectable()
export class RescheduleDuty {
  constructor(
    private readonly duties: DutyRepository,
    private readonly units: UnitRepository,
  ) {}

  async execute(id: string, input: RescheduleDutyInput): Promise<Duty> {
    const duty = await this.duties.findById(id);
    if (!duty) {
      throw new DutyNotFoundError(id);
    }

    if (input.unitId && !(await this.units.findById(input.unitId))) {
      throw new UnitNotFoundError(input.unitId);
    }

    const unitId = input.unitId ?? duty.unitId;
    const window = TimeWindow.create(
      input.startAt ?? duty.window.startAt,
      input.endAt ?? duty.window.endAt,
    );

    const clash = await this.duties.findOverlapping(unitId, window, id);
    if (clash) {
      throw new OverlappingDutyError(unitId, clash.id);
    }

    return this.duties.update(id, { unitId, window });
  }
}
