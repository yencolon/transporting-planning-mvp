import type { CreateUnitBody, UnitDto } from '@repo/shared';
import { apiRequest } from './client';

export const unitsApi = {
  list: () => apiRequest<UnitDto[]>('/units'),

  create: (body: CreateUnitBody) =>
    apiRequest<UnitDto>('/units', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  remove: (id: string) => apiRequest<void>(`/units/${id}`, { method: 'DELETE' }),
};
