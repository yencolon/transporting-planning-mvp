export class InvalidTimeWindowError extends Error {}

export class DutyNotFoundError extends Error {
  constructor(readonly dutyId: string) {
    super(`Duty ${dutyId} does not exist.`);
  }
}

export class OverlappingDutyError extends Error {
  constructor(
    readonly unitId: string,
    readonly conflictingDutyId?: string,
  ) {
    super(
      `Unit ${unitId} already has a duty overlapping that time window${
        conflictingDutyId ? ` (duty ${conflictingDutyId})` : ''
      }.`,
    );
  }
}
