import { Duty } from './duty';
import { TimeWindow } from './time-window';

export interface NewDuty {
  routeId: string;
  unitId: string;
  window: TimeWindow;
}

export interface DutyChanges {
  unitId?: string;
  window?: TimeWindow;
}

export abstract class DutyRepository {
  abstract create(duty: NewDuty): Promise<Duty>;
  abstract update(id: string, changes: DutyChanges): Promise<Duty>;
  abstract findById(id: string): Promise<Duty | null>;
  abstract findByRouteId(routeId: string): Promise<Duty[]>;
  abstract findByUnitId(unitId: string): Promise<Duty[]>;
  abstract findOverlapping(
    unitId: string,
    window: TimeWindow,
    excludeDutyId?: string,
  ): Promise<Duty | null>;
  abstract delete(id: string): Promise<void>;
}
