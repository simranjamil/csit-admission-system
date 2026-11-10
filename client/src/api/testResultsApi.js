import { api } from "./client";
 
export const fetchTestResults = async (params) => (await api.get("/test-results", { params })).data;
 
export const fetchTestResultRuleVersions = async (sessionId) =>
  (await api.get("/test-results/rule-versions", { params: { sessionId } })).data;
 
export const previewTestResults = async (payload) => (await api.post("/test-results/preview", payload)).data;
 
export const runTestResults = async (payload) => (await api.post("/test-results/run", payload)).data;
 
export const downloadTestResults = async (params) =>
  (await api.get("/test-results/export", { params, responseType: "blob" })).data;

