import { api } from "./client";
 
export const fetchMe = async () => {
  try {
    const { data } = await api.get("/auth/me");
    return data;
  } catch (error) {
    if (error.response?.status === 401) return null;
    throw error;
  }
};
 
export const loginRequest = async ({ username, password }) => {
  const { data } = await api.post("/auth/login", { username, password });
  return data;
};
 
export const logoutRequest = async () => {
  await api.post("/auth/logout");
};
