import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchImports, previewImport, runImport, setImportDone } from "../api/importsApi";
 
export function useImports(sessionId) {
  return useQuery({
    queryKey: ["imports", sessionId],
    queryFn: () => fetchImports(sessionId),
    enabled: Boolean(sessionId),
  });
}
 
export function usePreviewImport() {
  return useMutation({ mutationFn: previewImport });
}
 
export function useRunImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runImport,
    onSuccess: () => {
      for (const key of ["imports", "eligibility", "dashboard-summary"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}
 
export function useSetImportDone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setImportDone,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["imports"] }),
  });
}
