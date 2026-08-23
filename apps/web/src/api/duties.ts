import type {
  AssignDutyBody,
  DutyDto,
  RescheduleDutyBody,
} from '@repo/shared';
import { apiRequest } from './client';

/** Dates are Date objects in the schemas and ISO strings on the wire. */
type Wire<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K];
};

export const dutiesApi = {
  assign: (body: Wire<AssignDutyBody>) =>
    apiRequest<DutyDto>('/duties', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  reschedule: (id: string, body: Wire<RescheduleDutyBody>) =>
    apiRequest<DutyDto>(`/duties/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  remove: (id: string) =>
    apiRequest<void>(`/duties/${id}`, { method: 'DELETE' }),
};
