import { TimeWindow } from './time-window';

export interface Duty {
  id: string;
  routeId: string;
  unitId: string;
  window: TimeWindow;
}
