import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { unitsApi } from "../api/units";

export const unitKeys = {
  all: ["units"] as const,
};

export function useUnits() {
  return useQuery({ queryKey: unitKeys.all, queryFn: unitsApi.list });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => unitsApi.create({ name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: unitKeys.all }),
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => unitsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: unitKeys.all }),
  });
}
