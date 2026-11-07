import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchEligibility,
  fetchEligibilityRuleVersions,
  previewEligibility,
  runEligibility,
} from "../api/eligibilityApi";
 
export function useEligibility(sessionId, filters) {
  return useQuery({
    queryKey: ["eligibility", sessionId, filters],
    queryFn: () => fetchEligibility({ sessionId, ...filters }),
    enabled: Boolean(sessionId),
  });
}
 
export function useEligibilityRuleVersions(sessionId) {
  return useQuery({
    queryKey: ["eligibility-rule-versions", sessionId],
    queryFn: () => fetchEligibilityRuleVersions(sessionId),
    enabled: Boolean(sessionId),
  });
}
 
export function usePreviewEligibility() {
  return useMutation({ mutationFn: previewEligibility });
}
 
export function useRunEligibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runEligibility,
    onSuccess: () => {
      for (const key of ["eligibility", "dashboard-summary"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}
