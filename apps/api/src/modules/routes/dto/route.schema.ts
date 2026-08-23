import { z } from 'zod';

/**
 * Schemas guard the shape and types of the request only.
 * Business rules (coordinate ranges, blank names) stay in the domain.
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

export type CreateRouteBody = z.infer<typeof createRouteSchema>;
export type UpdateRouteBody = z.infer<typeof updateRouteSchema>;
