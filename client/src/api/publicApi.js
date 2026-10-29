import { api } from "./client";

export const fetchPublicSummary = async () => {
  const { data } = await api.get("/public/summary");
  return data;
};
