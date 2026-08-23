import { Injectable } from '@nestjs/common';
import { RouteNotFoundError } from '../../routes/domain/errors';
import { RouteRepository } from '../../routes/domain/route.repository';
import { UnitNotFoundError } from '../../units/domain/errors';
import { UnitRepository } from '../../units/domain/unit.repository';
import { Duty } from '../domain/duty';
import { DutyRepository } from '../domain/duty.repository';
import { OverlappingDutyError } from '../domain/errors';
import { TimeWindow } from '../domain/time-window';

export interface AssignDutyInput {
  routeId: string;
  unitId: string;
  startAt: Date;
  endAt: Date;
}

@Injectable()
export class AssignDuty {
  constructor(
    private readonly duties: DutyRepository,
    private readonly routes: RouteRepository,
    private readonly units: UnitRepository,
  ) {}

  async execute(input: AssignDutyInput): Promise<Duty> {
    const window = TimeWindow.create(input.startAt, input.endAt);

    if (!(await this.routes.findById(input.routeId))) {
      throw new RouteNotFoundError(input.routeId);
    }
    if (!(await this.units.findById(input.unitId))) {
      throw new UnitNotFoundError(input.unitId);
    }

    const clash = await this.duties.findOverlapping(input.unitId, window);
    if (clash) {
      throw new OverlappingDutyError(input.unitId, clash.id);
    }

    return this.duties.create({
      routeId: input.routeId,
      unitId: input.unitId,
      window,
    });
  }
}
