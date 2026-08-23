import type {
  AssignDutyBody,
  CreateRouteBody,
  DutyDto,
  RescheduleDutyBody,
  RouteDetailDto,
  RouteDto,
  RouteSummaryDto,
  UnitDto,
  UpdateRouteBody,
} from '@repo/shared';
import { apiRequest } from './client';

/** Dates are Date objects in the schemas and ISO strings on the wire. */
type Wire<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K];
};

const json = (body: unknown) => JSON.stringify(body);

export const routesApi = {
  list: () => apiRequest<RouteSummaryDto[]>('/routes'),

  detail: (id: string) => apiRequest<RouteDetailDto>(`/routes/${id}`),

  create: (body: CreateRouteBody) =>
    apiRequest<RouteDto>('/routes', { method: 'POST', body: json(body) }),

  update: (id: string, body: UpdateRouteBody) =>
    apiRequest<RouteDto>(`/routes/${id}`, {
      method: 'PATCH',
      body: json(body),
    }),

  remove: (id: string) =>
    apiRequest<void>(`/routes/${id}`, { method: 'DELETE' }),
};

export const dutiesApi = {
  assign: (body: Wire<AssignDutyBody>) =>
    apiRequest<DutyDto>('/duties', { method: 'POST', body: json(body) }),

  reschedule: (id: string, body: Wire<RescheduleDutyBody>) =>
    apiRequest<DutyDto>(`/duties/${id}`, { method: 'PATCH', body: json(body) }),

  remove: (id: string) =>
    apiRequest<void>(`/duties/${id}`, { method: 'DELETE' }),
};

export const unitsApi = {
  list: () => apiRequest<UnitDto[]>('/units'),
};
