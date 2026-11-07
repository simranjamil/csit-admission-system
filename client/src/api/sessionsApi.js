import { api } from "./client";
export const fetchSessions = async () => (await api.get("/sessions")).data;
export const createSession = async (payload) =>
  (await api.post("/sessions", payload)).data;
export const updateSession = async ({ id, ...payload }) =>
  (await api.patch("/sessions/" + id, payload)).data;
export const setSessionStatus = async ({ id, status }) =>
  (await api.patch("/sessions/" + id + "/status", { status })).data;
export const fetchSessionOptions = async (id) =>
  (await api.get("/sessions/" + id + "/options")).data;
export const saveSessionOptions = async ({ id, options }) =>
  (await api.put("/sessions/" + id + "/options", { options })).data;
