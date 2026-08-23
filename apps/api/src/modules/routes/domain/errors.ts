export class InvalidRouteError extends Error {}

export class RouteNotFoundError extends Error {
  constructor(readonly routeId: string) {
    super(`Route ${routeId} does not exist.`);
  }
}

export class RouteHasDutiesError extends Error {
  constructor(
    readonly routeId: string,
    readonly dutyCount: number,
  ) {
    super(
      `Route ${routeId} still has ${dutyCount} duty(ies) assigned and cannot be deleted.`,
    );
  }
}
