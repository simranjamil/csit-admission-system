import { createContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMe, loginRequest, logoutRequest } from "../api/authApi";
 
export const AuthContext = createContext(null);
 
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
 
  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    retry: false,
    staleTime: Infinity,
  });
 
  const login = async (credentials) => {
    const loggedInUser = await loginRequest(credentials);
    queryClient.setQueryData(["me"], loggedInUser);
    return loggedInUser;
  };
 
  const logout = async () => {
    await logoutRequest();
    queryClient.setQueryData(["me"], null);
  };
 
  return (
    <AuthContext.Provider
      value={{ user: user ?? null, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
