import { z } from "zod";
export const createVersionSchema = z.object({
  baseVersion: z.number().int().positive(),
  config: z.record(z.string(), z.unknown()),
  reason: z.string().trim().min(3, "Please write a short reason").max(300),
});
