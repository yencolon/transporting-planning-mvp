import { Injectable } from '@nestjs/common';
import { Duty } from '../domain/duty';
import { DutyRepository } from '../domain/duty.repository';
import { TimeWindow } from '../domain/time-window';

export interface ListUnitDutiesInput {
  unitId: string;
  from?: Date;
  to?: Date;
}

/**
 * Powers the conflict timeline: the schedule a unit already has, so the UI can
 * show a clash before the user submits. An unknown unit returns an empty list
 * rather than a 404 — it is a filter value, not a resource being fetched.
 */
@Injectable()
export class ListUnitDuties {
  constructor(private readonly duties: DutyRepository) {}

  async execute({ unitId, from, to }: ListUnitDutiesInput): Promise<Duty[]> {
    const range = from && to ? TimeWindow.create(from, to) : undefined;
    return this.duties.findByUnitId(unitId, range);
  }
}
