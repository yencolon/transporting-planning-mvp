export class UnitNotFoundError extends Error {
  constructor(readonly unitId: string) {
    super(`Unit ${unitId} does not exist.`);
  }
}
