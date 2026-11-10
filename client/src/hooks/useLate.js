import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchLate, fetchLateMatch, resolveLate } from "../api/lateApi";
 
export function useLate(sessionId) {
  return useQuery({
    queryKey: ["late-admissions", sessionId],
    queryFn: () => fetchLate(sessionId),
    enabled: Boolean(sessionId),
  });
}
 
export function useLateMatch(sessionId, cnic) {
  const digits = String(cnic ?? "").replace(/\D/g, "");
  return useQuery({
    queryKey: ["late-match", sessionId, digits],
    queryFn: () => fetchLateMatch({ sessionId, cnic: digits }),
    enabled: Boolean(sessionId) && digits.length === 13,
  });
}
 
export function useResolveLate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resolveLate,
    onSuccess: () => {
      for (const key of ["late-admissions", "result-overview", "result-rows", "eligibility", "test-results", "dashboard-summary"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}
