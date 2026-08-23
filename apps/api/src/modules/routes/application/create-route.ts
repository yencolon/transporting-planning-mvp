import { Injectable } from '@nestjs/common';
import {
  PointInput,
  Route,
  toOrderedPoints,
  toRouteName,
} from '../domain/route';
import { RouteRepository } from '../domain/route.repository';

export interface CreateRouteInput {
  name: string;
  points: PointInput[];
}

@Injectable()
export class CreateRoute {
  constructor(private readonly routes: RouteRepository) {}

  async execute(input: CreateRouteInput): Promise<Route> {
    return this.routes.create({
      name: toRouteName(input.name),
      points: toOrderedPoints(input.points),
    });
  }
}
