import { z } from "zod";
 
// A file upload sends everything as text, so numbers and booleans arrive as strings.
const sessionId = z.string().regex(/^\d+$/, "Invalid session").transform(Number);
 
export const previewSchema = z.object({ sessionId });
 
export const importSchema = z.object({
  sessionId,
  batchName: z.string().trim().min(3, "Batch name must be at least 3 characters").max(100),
  description: z.string().trim().max(300).default(""),
  allowReimport: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
});
 
export const doneSchema = z.object({
  sessionId: z.number().int().positive(),
  done: z.boolean(),
});
