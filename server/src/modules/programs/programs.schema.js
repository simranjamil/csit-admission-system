import { z } from "zod";
const name = z
  .string()
  .trim()
  .min(3, "Name must be at least 3 characters")
  .max(100);
const timings = z
  .array(z.string().trim().min(2, "Timing is too short").max(30))
  .min(1, "Add at least one timing")
  .max(6, "Maximum 6 timings");
export const createProgramSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{1,10}$/, "Code: 1 to 10 letters or numbers"),
  name,
  timings,
});
export const updateProgramSchema = z.object({
  name,
  isActive: z.boolean(),
  timings,
});
