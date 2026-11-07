import { api } from "./client";
 
const toForm = (fields) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
};
 
export const fetchImports = async (sessionId) =>
  (await api.get("/imports", { params: { sessionId } })).data;
 
export const previewImport = async ({ sessionId, file }) =>
  (await api.post("/imports/preview", toForm({ sessionId, file }))).data;
 
export const runImport = async ({ sessionId, file, batchName, description, allowReimport }) =>
  (
    await api.post(
      "/imports",
      toForm({ sessionId, batchName, description, allowReimport: String(allowReimport), file })
    )
  ).data;
 
export const setImportDone = async (payload) => (await api.post("/imports/done", payload)).data;
