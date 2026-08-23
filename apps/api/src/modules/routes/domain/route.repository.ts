import { Route, RoutePoint, RouteSummary } from './route';

export interface NewRoute {
  name: string;
  points: RoutePoint[];
}

export interface RouteChanges {
  name?: string;
  points?: RoutePoint[];
}

export abstract class RouteRepository {
  abstract create(route: NewRoute): Promise<Route>;
  abstract update(id: string, changes: RouteChanges): Promise<Route>;
  abstract findById(id: string): Promise<Route | null>;
  abstract list(): Promise<RouteSummary[]>;
  abstract delete(id: string): Promise<void>;
}
