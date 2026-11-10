import { z } from "zod";
 
const ids = {
  sessionId: z.number().int().positive(),
  ruleVersionId: z.number().int().positive(),
};
 
export const previewSchema = z.object(ids);
export const runSchema = z.object(ids);
