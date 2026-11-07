import { z } from "zod";
const date = z
.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date"), 
z.literal("")])
.nullable()
.optional();
const name = z.string().trim().min(3, "Name must be at least 3characters").max(100);
const datesInOrder = (v) => !v.startDate || !v.endDate || v.endDate >= 
v.startDate;
const orderIssue = { message: "End date cannot be before start date", path: 
["endDate"] };
export const createSessionSchema = z
  .object({
    name,
    year: z.number().int().min(2000, "Enter a valid year").max(2100, "Enter a valid year"),
    startDate: date,
    endDate: date,
    copyFromSessionId: z.number().int().positive().nullable().optional(),
  })
  .refine(datesInOrder, orderIssue);
export const updateSessionSchema = z
  .object({ name, startDate: date, endDate: date })
  .refine(datesInOrder, orderIssue);
export const statusSchema = z.object({ status: z.enum(["ACTIVE", "CLOSED"]) 
});
export const optionsSchema = z.object({
  options: z
    .array(
      z.object({
        programTimingId: z.number().int().positive(),
        seats: z.number().int().min(1, "Seats must be at least 1").max(2000),
        rollPrefix: z
          .string()
          .trim()
          .toUpperCase()
          .max(20)
          .regex(/^[A-Z0-9-]*$/, "Roll prefix: letters, numbers and dash only")
          .optional(),
      })
    )
    .max(60),
});
