import { api } from "./client";
 
export const fetchLate = async (sessionId) =>
  (await api.get("/late-admissions", { params: { sessionId } })).data;
 
export const fetchLateMatch = async ({ sessionId, cnic }) =>
  (await api.get("/late-admissions/match", { params: { sessionId, cnic } })).data.match;
 
export const resolveLate = async ({ applicationId, ...body }) =>
  (await api.post("/late-admissions/" + applicationId + "/resolve", body)).data;