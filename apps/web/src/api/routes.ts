import type {
  CreateRouteBody,
  RouteDetailDto,
  RouteDto,
  RouteSummaryDto,
  UpdateRouteBody,
} from '@repo/shared';
import { apiRequest } from './client';

export const routesApi = {
  list: () => apiRequest<RouteSummaryDto[]>('/routes'),

  detail: (id: string) => apiRequest<RouteDetailDto>(`/routes/${id}`),

  create: (body: CreateRouteBody) =>
    apiRequest<RouteDto>('/routes', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: string, body: UpdateRouteBody) =>
    apiRequest<RouteDto>(`/routes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  remove: (id: string) =>
    apiRequest<void>(`/routes/${id}`, { method: 'DELETE' }),
};
