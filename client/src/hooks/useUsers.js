import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchUsers,
  fetchRoles,
  createUser,
  updateUser,
  setUserActive,
} from "../api/usersApi";
 
export function useUsers() {
  return useQuery({ queryKey: ["users"], queryFn: fetchUsers });
}
 
export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
    staleTime: 5 * 60 * 1000,
  });
}
 
// After any change: refresh the list, the dashboard (recent activity) and the logged-in user.
function useRefreshAfterChange() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    queryClient.invalidateQueries({ queryKey: ["me"] });
  };
}
 
export function useCreateUser() {
  const refresh = useRefreshAfterChange();
  return useMutation({ mutationFn: createUser, onSuccess: refresh });
}
 
export function useUpdateUser() {
  const refresh = useRefreshAfterChange();
  return useMutation({ mutationFn: updateUser, onSuccess: refresh });
}
 
export function useSetUserActive() {
  const refresh = useRefreshAfterChange();
  return useMutation({ mutationFn: setUserActive, onSuccess: refresh });
}
