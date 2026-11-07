import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchRules,
  fetchRuleVersions,
  createRuleVersion,
} from "../api/rulesApi";
export function useRules(sessionId) {
  return useQuery({
    queryKey: ["rules", sessionId],
    queryFn: () => fetchRules(sessionId),
    enabled: Boolean(sessionId),
  });
}
export function useRuleVersions(ruleId) {
  return useQuery({
    queryKey: ["rule-versions", ruleId],
    queryFn: () => fetchRuleVersions(ruleId),
    enabled: Boolean(ruleId),
  });
}
export function useCreateRuleVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRuleVersion,
    onSuccess: () => {
      for (const key of ["rules", "rule-versions", "dashboard-summary"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}
