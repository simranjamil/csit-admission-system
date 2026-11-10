import { api } from "./client";

const toForm = (fields) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
};

export const fetchResultOverview = async (sessionId) =>
  (await api.get("/result-imports", { params: { sessionId } })).data;

export const fetchResultRows = async (params) =>
  (await api.get("/result-imports/rows", { params })).data;

export const previewResults = async ({ sessionId, programId, file }) =>
  (
    await api.post(
      "/result-imports/preview",
      toForm({ sessionId, programId, file }),
    )
  ).data;

export const runResultImport = async ({
  sessionId,
  programId,
  description,
  file,
}) =>
  (
    await api.post(
      "/result-imports",
      toForm({ sessionId, programId, description, file }),
    )
  ).data;

export const setResultsDone = async (payload) =>
  (await api.post("/result-imports/done", payload)).data;
