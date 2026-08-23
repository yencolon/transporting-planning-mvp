import { InvalidTimeWindowError } from './errors';

export class TimeWindow {
  private constructor(
    readonly startAt: Date,
    readonly endAt: Date,
  ) {}

  static create(startAt: Date, endAt: Date): TimeWindow {
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new InvalidTimeWindowError(
        'A duty needs valid start and end dates.',
      );
    }
    if (endAt <= startAt) {
      throw new InvalidTimeWindowError('A duty must end after it starts.');
    }
    return new TimeWindow(startAt, endAt);
  }

  /**
   * Half-open comparison: a window ending exactly when another starts does not overlap.
   * Mirrored by the Duty_unit_window_no_overlap constraint in the database.
   */
  overlaps(other: TimeWindow): boolean {
    return this.startAt < other.endAt && this.endAt > other.startAt;
  }
}
