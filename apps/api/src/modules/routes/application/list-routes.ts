import { Injectable } from '@nestjs/common';
import { RouteSummary } from '../domain/route';
import { RouteRepository } from '../domain/route.repository';

@Injectable()
export class ListRoutes {
  constructor(private readonly routes: RouteRepository) {}

  execute(): Promise<RouteSummary[]> {
    return this.routes.list();
  }
}
