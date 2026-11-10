import { z } from "zod";
 
// A file upload sends everything as text, so numbers arrive as strings.
const id = z.string().regex(/^\d+$/, "Invalid id").transform(Number);
 
export const previewSchema = z.object({ sessionId: id, programId: id });
 
export const importSchema = z.object({
  sessionId: id,
  programId: id,
  description: z.string().trim().max(300).default(""),
});
 
export const doneSchema = z.object({
  sessionId: z.number().int().positive(),
  done: z.boolean(),
});
