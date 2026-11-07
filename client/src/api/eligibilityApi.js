import { api } from "./client";

export const fetchEligibility = async (params) =>
  (await api.get("/eligibility", { params })).data;

export const fetchEligibilityRuleVersions = async (sessionId) =>
  (await api.get("/eligibility/rule-versions", { params: { sessionId } })).data;

export const previewEligibility = async (payload) =>
  (await api.post("/eligibility/preview", payload)).data;

export const runEligibility = async (payload) =>
  (await api.post("/eligibility/run", payload)).data;

export const downloadEligibility = async (params) =>
  (await api.get("/eligibility/export", { params, responseType: "blob" })).data;
