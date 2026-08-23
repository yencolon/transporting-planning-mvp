import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateRouteBody, UpdateRouteBody } from '@repo/shared';
import { dutiesApi } from '../../api/duties';
import { routesApi } from '../../api/routes';

export const routeKeys = {
  all: ['routes'] as const,
  detail: (id: string) => ['routes', id] as const,
};

export const dutyKeys = {
  forUnit: (unitId: string, from?: string, to?: string) =>
    ['duties', 'unit', unitId, from ?? '', to ?? ''] as const,
};

/** The unit's existing schedule, used to show a clash before submitting. */
export function useUnitDuties(unitId: string, from?: string, to?: string) {
  return useQuery({
    queryKey: dutyKeys.forUnit(unitId, from, to),
    queryFn: () => dutiesApi.listForUnit(unitId, from, to),
    enabled: Boolean(unitId),
  });
}

export function useRoutes() {
  return useQuery({ queryKey: routeKeys.all, queryFn: routesApi.list });
}

export function useRouteDetail(id: string) {
  return useQuery({
    queryKey: routeKeys.detail(id),
    queryFn: () => routesApi.detail(id),
  });
}

export function useCreateRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateRouteBody) => routesApi.create(body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: routeKeys.all }),
  });
}

export function useUpdateRoute(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateRouteBody) => routesApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routeKeys.all });
      queryClient.invalidateQueries({ queryKey: routeKeys.detail(id) });
    },
  });
}

export function useDeleteRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => routesApi.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: routeKeys.all }),
  });
}

interface AssignDutyInput {
  routeId: string;
  unitId: string;
  startAt: string;
  endAt: string;
}

export function useAssignDuty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AssignDutyInput) => dutiesApi.assign(body),
    onSuccess: (_duty, { routeId }) => {
      queryClient.invalidateQueries({ queryKey: routeKeys.detail(routeId) });
      queryClient.invalidateQueries({ queryKey: ['duties', 'unit'] });
    },
  });
}

export function useDeleteDuty(routeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dutiesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routeKeys.detail(routeId) });
      queryClient.invalidateQueries({ queryKey: ['duties', 'unit'] });
    },
  });
}
