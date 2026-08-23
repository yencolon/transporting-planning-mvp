import { z } from 'zod';

export const assignDutySchema = z.strictObject({
  routeId: z.string().min(1),
  unitId: z.string().min(1),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
});

export const rescheduleDutySchema = z.strictObject({
  unitId: z.string().min(1).optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
});

export type AssignDutyBody = z.infer<typeof assignDutySchema>;
export type RescheduleDutyBody = z.infer<typeof rescheduleDutySchema>;
