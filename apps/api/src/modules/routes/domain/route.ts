import { InvalidRouteError } from './errors';

export interface RoutePoint {
  sequence: number;
  lat: number;
  lng: number;
  name: string | null;
}

export interface Route {
  id: string;
  name: string;
  points: RoutePoint[];
}

export interface RouteSummary {
  id: string;
  name: string;
  pointCount: number;
}

export interface PointInput {
  lat: number;
  lng: number;
  name?: string | null;
}

export function toRouteName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new InvalidRouteError('A route needs a name.');
  }
  return trimmed;
}

export function toOrderedPoints(points: PointInput[]): RoutePoint[] {
  return points.map((point, index) => {
    if (!Number.isFinite(point.lat) || point.lat < -90 || point.lat > 90) {
      throw new InvalidRouteError(
        `Point ${index} has an out-of-range latitude: ${point.lat}`,
      );
    }
    if (!Number.isFinite(point.lng) || point.lng < -180 || point.lng > 180) {
      throw new InvalidRouteError(
        `Point ${index} has an out-of-range longitude: ${point.lng}`,
      );
    }

    return {
      sequence: index,
      lat: point.lat,
      lng: point.lng,
      name: point.name?.trim() || null,
    };
  });
}
