export class InvalidUnitError extends Error {}

export class UnitNotFoundError extends Error {
  constructor(readonly unitId: string) {
    super(`Unit ${unitId} does not exist.`);
  }
}

export class DuplicateUnitError extends Error {
  constructor(readonly name: string) {
    super(`A unit named ${name} already exists.`);
  }
}

export class UnitHasDutiesError extends Error {
  constructor(
    readonly unitId: string,
    readonly dutyCount: number,
  ) {
    super(
      `Unit ${unitId} still has ${dutyCount} duty(ies) assigned and cannot be deleted.`,
    );
  }
}
