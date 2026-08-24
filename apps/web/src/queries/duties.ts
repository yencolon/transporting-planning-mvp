import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dutiesApi } from "../api/duties";
import { routeKeys } from "./routes";

export const dutyKeys = {
  /** Prefijo común: invalidar aquí alcanza la agenda de cualquier unidad. */
  unit: ["duties", "unit"] as const,
  forUnit: (unitId: string, from?: string, to?: string) =>
    ["duties", "unit", unitId, from ?? "", to ?? ""] as const,
};

/** The unit's existing schedule, used to show a clash before submitting. */
export function useUnitDuties(unitId: string, from?: string, to?: string) {
  return useQuery({
    queryKey: dutyKeys.forUnit(unitId, from, to),
    queryFn: () => dutiesApi.listForUnit(unitId, from, to),
    enabled: Boolean(unitId),
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
      queryClient.invalidateQueries({ queryKey: dutyKeys.unit });
    },
  });
}

export function useDeleteDuty(routeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dutiesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routeKeys.detail(routeId) });
      queryClient.invalidateQueries({ queryKey: dutyKeys.unit });
    },
  });
}
