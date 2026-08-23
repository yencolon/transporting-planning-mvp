import { useQuery } from '@tanstack/react-query';
import { routesApi } from '../../api/routes';
import { unitsApi } from '../../api/units';

export const routeKeys = {
  all: ['routes'] as const,
  detail: (id: string) => ['routes', id] as const,
};

export const unitKeys = {
  all: ['units'] as const,
};

export function useRoutes() {
  return useQuery({ queryKey: routeKeys.all, queryFn: routesApi.list });
}

export function useRouteDetail(id: string) {
  return useQuery({
    queryKey: routeKeys.detail(id),
    queryFn: () => routesApi.detail(id),
  });
}

export function useUnits() {
  return useQuery({ queryKey: unitKeys.all, queryFn: unitsApi.list });
}
