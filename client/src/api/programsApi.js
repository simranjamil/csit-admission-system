import { api } from "./client";
export const fetchPrograms = async () => (await api.get("/programs")).data;
export const createProgram = async (payload) =>
  (await api.post("/programs", payload)).data;
export const updateProgram = async ({ id, ...payload }) =>
  (await api.patch("/programs/" + id, payload)).data;
