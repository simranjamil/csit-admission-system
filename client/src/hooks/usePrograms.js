import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPrograms,
  createProgram,
  updateProgram,
} from "../api/programsApi";
export function usePrograms() {
  return useQuery({ queryKey: ["programs"], queryFn: fetchPrograms });
}
function useRefreshAfterChange() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of ["programs", "session-options", "dashboard-summary"]) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  };
}
export function useCreateProgram() {
  const refresh = useRefreshAfterChange();
  return useMutation({ mutationFn: createProgram, onSuccess: refresh });
}
export function useUpdateProgram() {
  const refresh = useRefreshAfterChange();
  return useMutation({ mutationFn: updateProgram, onSuccess: refresh });
}
