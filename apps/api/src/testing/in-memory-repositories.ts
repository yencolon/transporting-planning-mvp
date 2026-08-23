import { Duty } from '../modules/duties/domain/duty';
import {
  DutyChanges,
  DutyRepository,
  NewDuty,
} from '../modules/duties/domain/duty.repository';
import { TimeWindow } from '../modules/duties/domain/time-window';
import { Route, RouteSummary } from '../modules/routes/domain/route';
import {
  NewRoute,
  RouteChanges,
  RouteRepository,
} from '../modules/routes/domain/route.repository';
import { Unit } from '../modules/units/domain/unit';
import { UnitRepository } from '../modules/units/domain/unit.repository';

let counter = 0;
const nextId = (prefix: string) => `${prefix}-${++counter}`;

export class InMemoryRouteRepository implements RouteRepository {
  readonly rows = new Map<string, Route>();

  async create(route: NewRoute): Promise<Route> {
    const created = { id: nextId('route'), ...route };
    this.rows.set(created.id, created);
    return created;
  }

  async update(id: string, changes: RouteChanges): Promise<Route> {
    const current = this.rows.get(id)!;
    const updated = {
      ...current,
      ...(changes.name === undefined ? {} : { name: changes.name }),
      ...(changes.points === undefined ? {} : { points: changes.points }),
    };
    this.rows.set(id, updated);
    return updated;
  }

  async findById(id: string): Promise<Route | null> {
    return this.rows.get(id) ?? null;
  }

  async list(): Promise<RouteSummary[]> {
    return [...this.rows.values()].map((route) => ({
      id: route.id,
      name: route.name,
      pointCount: route.points.length,
    }));
  }

  async delete(id: string): Promise<void> {
    this.rows.delete(id);
  }
}

export class InMemoryDutyRepository implements DutyRepository {
  readonly rows = new Map<string, Duty>();

  async create(duty: NewDuty): Promise<Duty> {
    const created = { id: nextId('duty'), ...duty };
    this.rows.set(created.id, created);
    return created;
  }

  async update(id: string, changes: DutyChanges): Promise<Duty> {
    const current = this.rows.get(id)!;
    const updated = {
      ...current,
      ...(changes.unitId === undefined ? {} : { unitId: changes.unitId }),
      ...(changes.window === undefined ? {} : { window: changes.window }),
    };
    this.rows.set(id, updated);
    return updated;
  }

  async findById(id: string): Promise<Duty | null> {
    return this.rows.get(id) ?? null;
  }

  async findByRouteId(routeId: string): Promise<Duty[]> {
    return [...this.rows.values()].filter((duty) => duty.routeId === routeId);
  }

  async findByUnitId(unitId: string, range?: TimeWindow): Promise<Duty[]> {
    return [...this.rows.values()]
      .filter((duty) => duty.unitId === unitId)
      .filter((duty) => !range || duty.window.overlaps(range));
  }

  async findOverlapping(
    unitId: string,
    window: TimeWindow,
    excludeDutyId?: string,
  ): Promise<Duty | null> {
    return (
      [...this.rows.values()].find(
        (duty) =>
          duty.unitId === unitId &&
          duty.id !== excludeDutyId &&
          duty.window.overlaps(window),
      ) ?? null
    );
  }

  async delete(id: string): Promise<void> {
    this.rows.delete(id);
  }
}

export class InMemoryUnitRepository implements UnitRepository {
  readonly rows = new Map<string, Unit>();

  /** Synchronous helper for specs that just need a unit to exist. */
  add(name: string): Unit {
    const unit = { id: nextId('unit'), name };
    this.rows.set(unit.id, unit);
    return unit;
  }

  async create(name: string): Promise<Unit> {
    return this.add(name);
  }

  async findById(id: string): Promise<Unit | null> {
    return this.rows.get(id) ?? null;
  }

  async findByName(name: string): Promise<Unit | null> {
    return [...this.rows.values()].find((unit) => unit.name === name) ?? null;
  }

  async list(): Promise<Unit[]> {
    return [...this.rows.values()];
  }

  async delete(id: string): Promise<void> {
    this.rows.delete(id);
  }
}
