import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTestResults,
  fetchTestResultRuleVersions,
  previewTestResults,
  runTestResults,
} from "../api/testResultsApi";
 
export function useTestResults(sessionId, filters) {
  return useQuery({
    queryKey: ["test-results", sessionId, filters],
    queryFn: () => fetchTestResults({ sessionId, ...filters }),
    enabled: Boolean(sessionId),
  });
}
 
export function useTestResultRuleVersions(sessionId) {
  return useQuery({
    queryKey: ["test-result-rule-versions", sessionId],
    queryFn: () => fetchTestResultRuleVersions(sessionId),
    enabled: Boolean(sessionId),
  });
}
 
export function usePreviewTestResults() {
  return useMutation({ mutationFn: previewTestResults });
}
 
export function useRunTestResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runTestResults,
    onSuccess: () => {
      for (const key of ["test-results", "late-admissions", "dashboard-summary"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}
