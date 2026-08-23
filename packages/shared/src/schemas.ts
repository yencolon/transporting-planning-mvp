import { z } from 'zod';

/**
 * Request schemas. Shared so the API validates and the React forms check
 * against the same definition.
 *
 * Shape and types only — business rules (coordinate ranges, blank names,
 * window ordering) live in the API's domain layer.
 */
const routePointSchema = z.strictObject({
  lat: z.number(),
  lng: z.number(),
  name: z.string().optional(),
});

export const createRouteSchema = z.strictObject({
  name: z.string(),
  points: z.array(routePointSchema),
});

export const updateRouteSchema = z.strictObject({
  name: z.string().optional(),
  points: z.array(routePointSchema).optional(),
});

export const createUnitSchema = z.strictObject({
  name: z.string(),
});

export const assignDutySchema = z.strictObject({
  routeId: z.string().min(1),
  unitId: z.string().min(1),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
});

/** Query for a unit's schedule; `from`/`to` narrow it to a day. */
export const listUnitDutiesSchema = z.strictObject({
  unitId: z.string().min(1),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const rescheduleDutySchema = z.strictObject({
  unitId: z.string().min(1).optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
});

export type CreateUnitBody = z.infer<typeof createUnitSchema>;
export type CreateRouteBody = z.infer<typeof createRouteSchema>;
export type UpdateRouteBody = z.infer<typeof updateRouteSchema>;
export type AssignDutyBody = z.infer<typeof assignDutySchema>;
export type ListUnitDutiesQuery = z.infer<typeof listUnitDutiesSchema>;
export type RescheduleDutyBody = z.infer<typeof rescheduleDutySchema>;
