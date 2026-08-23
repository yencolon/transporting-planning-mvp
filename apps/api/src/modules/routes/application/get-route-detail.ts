import { Injectable } from '@nestjs/common';
import { Duty } from '../../duties/domain/duty';
import { DutyRepository } from '../../duties/domain/duty.repository';
import { RouteNotFoundError } from '../domain/errors';
import { Route } from '../domain/route';
import { RouteRepository } from '../domain/route.repository';

export interface RouteDetail {
  route: Route;
  duties: Duty[];
}

@Injectable()
export class GetRouteDetail {
  constructor(
    private readonly routes: RouteRepository,
    private readonly duties: DutyRepository,
  ) {}

  async execute(id: string): Promise<RouteDetail> {
    const route = await this.routes.findById(id);
    if (!route) {
      throw new RouteNotFoundError(id);
    }

    return { route, duties: await this.duties.findByRouteId(id) };
  }
}
