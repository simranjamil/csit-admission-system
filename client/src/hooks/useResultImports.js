import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchResultOverview,
  fetchResultRows,
  previewResults,
  runResultImport,
  setResultsDone,
} from "../api/resultImportsApi";
 
export function useResultOverview(sessionId) {
  return useQuery({
    queryKey: ["result-overview", sessionId],
    queryFn: () => fetchResultOverview(sessionId),
    enabled: Boolean(sessionId),
  });
}
 
export function useResultRows(sessionId, programId) {
  return useQuery({
    queryKey: ["result-rows", sessionId, programId],
    queryFn: () => fetchResultRows({ sessionId, programId }),
    enabled: Boolean(sessionId && programId),
  });
}
 
export function usePreviewResults() {
  return useMutation({ mutationFn: previewResults });
}
 
export function useRunResultImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runResultImport,
    onSuccess: () => {
      for (const key of ["result-overview", "result-rows", "late-admissions", "test-results", "dashboard-summary"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}
 
export function useSetResultsDone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setResultsDone,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["result-overview"] }),
  });
}
