import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSessions,
  createSession,
  updateSession,
  setSessionStatus,
  fetchSessionOptions,
  saveSessionOptions,
} from "../api/sessionsApi";
export function useSessions({ enabled = true } = {}) {
  return useQuery({ queryKey: ["sessions"], queryFn: fetchSessions, enabled });
}
export function useSessionOptions(sessionId) {
  return useQuery({
    queryKey: ["session-options", sessionId],
    queryFn: () => fetchSessionOptions(sessionId),
    enabled: Boolean(sessionId),
  });
}
// A session change can alter options, rules and the dashboard numbers.
function useRefreshAfterChange() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of [
      "sessions",
      "session-options",
      "rules",
      "dashboardsummary",
    ]) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  };
}
export function useCreateSession() {
  const refresh = useRefreshAfterChange();
  return useMutation({ mutationFn: createSession, onSuccess: refresh });
}
export function useUpdateSession() {
  const refresh = useRefreshAfterChange();
  return useMutation({ mutationFn: updateSession, onSuccess: refresh });
}
export function useSetSessionStatus() {
  const refresh = useRefreshAfterChange();
  return useMutation({ mutationFn: setSessionStatus, onSuccess: refresh });
}
export function useSaveSessionOptions() {
  const refresh = useRefreshAfterChange();
  return useMutation({ mutationFn: saveSessionOptions, onSuccess: refresh });
}
