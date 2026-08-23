import { Injectable } from '@nestjs/common';
import { DutyRepository } from '../../duties/domain/duty.repository';
import { RouteHasDutiesError, RouteNotFoundError } from '../domain/errors';
import { RouteRepository } from '../domain/route.repository';

@Injectable()
export class DeleteRoute {
  constructor(
    private readonly routes: RouteRepository,
    private readonly duties: DutyRepository,
  ) {}

  async execute(id: string): Promise<void> {
    if (!(await this.routes.findById(id))) {
      throw new RouteNotFoundError(id);
    }

    const duties = await this.duties.findByRouteId(id);
    if (duties.length > 0) {
      throw new RouteHasDutiesError(id, duties.length);
    }

    await this.routes.delete(id);
  }
}
