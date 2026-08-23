import { Duty } from './domain/duty';

export interface DutyResponse {
  id: string;
  routeId: string;
  unitId: string;
  startAt: Date;
  endAt: Date;
}

/** The window is flattened at the HTTP boundary; the domain keeps it as a value object. */
export function toDutyResponse(duty: Duty): DutyResponse {
  return {
    id: duty.id,
    routeId: duty.routeId,
    unitId: duty.unitId,
    startAt: duty.window.startAt,
    endAt: duty.window.endAt,
  };
}
