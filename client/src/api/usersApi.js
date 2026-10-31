import { api } from "./client";
 
export const fetchUsers = async () => (await api.get("/users")).data;
 
export const fetchRoles = async () => (await api.get("/users/roles")).data;
 
export const createUser = async (payload) =>
  (await api.post("/users", payload)).data;
 
export const updateUser = async ({ id, ...payload }) =>
  (await api.patch("/users/" + id, payload)).data;
 
export const setUserActive = async ({ id, isActive }) =>
  (await api.patch("/users/" + id + "/status", { isActive })).data;
