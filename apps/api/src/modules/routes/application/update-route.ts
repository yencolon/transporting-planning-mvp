import { Injectable } from '@nestjs/common';
import { RouteNotFoundError } from '../domain/errors';
import { PointInput, Route, toOrderedPoints, toRouteName } from '../domain/route';
import { RouteRepository } from '../domain/route.repository';

export interface UpdateRouteInput {
  name?: string;
  points?: PointInput[];
}

@Injectable()
export class UpdateRoute {
  constructor(private readonly routes: RouteRepository) {}

  async execute(id: string, input: UpdateRouteInput): Promise<Route> {
    if (!(await this.routes.findById(id))) {
      throw new RouteNotFoundError(id);
    }

    return this.routes.update(id, {
      name: input.name === undefined ? undefined : toRouteName(input.name),
      points:
        input.points === undefined ? undefined : toOrderedPoints(input.points),
    });
  }
}
