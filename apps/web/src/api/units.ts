import type { UnitDto } from '@repo/shared';
import { apiRequest } from './client';

export const unitsApi = {
  list: () => apiRequest<UnitDto[]>('/units'),
};
