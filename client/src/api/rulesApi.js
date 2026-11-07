import { api } from "./client";
export const fetchRules = async (sessionId) =>
  (await api.get("/rules", { params: { sessionId } })).data;
export const fetchRuleVersions = async (ruleId) =>
  (await api.get("/rules/" + ruleId + "/versions")).data;
export const createRuleVersion = async ({ ruleId, ...payload }) =>
  (await api.post("/rules/" + ruleId + "/versions", payload)).data;
