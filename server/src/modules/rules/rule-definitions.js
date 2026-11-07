import { z } from "zod";
const twoDecimals = (v) => Math.round(v * 100) / 100 === v;
export const RULE_DEFINITIONS = [
  {
    key: "MIN_CGPA",
    title: "Minimum eligibility marks",
    description:
      "CGPA below the limit (total marks 4) or percentage below the limit (total marks above 4) is not eligible.",
    fields: [
      {
        name: "minCgpa",
        label: "Minimum CGPA (total marks 4)",
        type: "number",
        min: 0,
        max: 4,
        step: 0.01,
      },
      {
        name: "minPercentage",
        label: "Minimum percentage (total marks above 4)",
        type: "number",
        min: 0,
        max: 100,
        step: 0.01,
      },
      {
        name: "inclusive",
        label: "Exactly this value is eligible",
        type: "boolean",
      },
    ],
    schema: z
      .object({
        minCgpa: z
          .number()
          .min(0, "CGPA cannot be below 0")
          .max(4, "CGPA cannot be above 4")
          .refine(twoDecimals, "Use at most 2 decimal places"),
        minPercentage: z
          .number()
          .min(0, "Percentage cannot be below 0")
          .max(100, "Percentage cannot be above 100")
          .refine(twoDecimals, "Use at most 2 decimal places"),
        inclusive: z.boolean(),
      })
      .strict(),
    defaults: { minCgpa: 2.4, minPercentage: 60, inclusive: true },
    summarize: (c) =>
      "CGPA " +
      (c.inclusive ? ">= " : "> ") +
      c.minCgpa.toFixed(2) +
      " or " +
      (c.inclusive ? ">= " : "> ") +
      c.minPercentage +
      "%",
  },
  {
    key: "TEST_PASS",
    title: "Test pass percentage",
    description: "Test results below this percentage are marked failed.",
    fields: [
      {
        name: "passPercentage",
        label: "Pass percentage",
        type: "number",
        min: 0,
        max: 100,
        step: 0.01,
      },
      {
        name: "inclusive",
        label: "Exactly this percentage passes",
        type: "boolean",
      },
    ],
    schema: z
      .object({
        passPercentage: z
          .number()
          .min(0, "Percentage cannot be below 0")
          .max(100, "Percentage cannot be above 100")
          .refine(twoDecimals, "Use at most 2 decimal places"),
        inclusive: z.boolean(),
      })
      .strict(),
    defaults: { passPercentage: 50, inclusive: true },
    summarize: (c) =>
      (c.inclusive ? "Pass at " : "Pass above ") +
      c.passPercentage +
      (c.inclusive ? "% or more" : "%"),
  },
  {
    key: "MERIT_WEIGHTS",
    title: "Merit weights",
    description:
      "Final merit = test percentage x test weight + interview percentage x interview weight.",
    fields: [
      {
        name: "testWeight",
        label: "Test weight (%)",
        type: "number",
        min: 0,
        max: 100,
        step: 1,
      },
      {
        name: "interviewWeight",
        label: "Interview weight (%)",
        type: "number",
        min: 0,
        max: 100,
        step: 1,
      },
      {
        name: "interviewMaxMarks",
        label: "Interview marks out of",
        type: "number",
        min: 1,
        max: 1000,
        step: 1,
      },
    ],
    schema: z
      .object({
        testWeight: z.number().min(0).max(100),
        interviewWeight: z.number().min(0).max(100),
        interviewMaxMarks: z
          .number()
          .int("Interview marks must be a whole number")
          .min(1)
          .max(1000),
      })
      .strict()
      .refine((c) => Math.abs(c.testWeight + c.interviewWeight - 100) < 1e-9, {
        message: "Test and interview weights must add up to 100",
        path: ["interviewWeight"],
      }),
    defaults: { testWeight: 80, interviewWeight: 20, interviewMaxMarks: 20 },
    summarize: (c) =>
      "Test " +
      c.testWeight +
      "% + Interview " +
      c.interviewWeight +
      "% (interview out of " +
      c.interviewMaxMarks +
      ")",
  },
  {
    key: "INTERVIEW_SLOT",
    title: "Interview slot and batch",
    description:
      "Default slot length and batch size when the schedule is generated.",
    fields: [
      {
        name: "slotMinutes",
        label: "Slot length (minutes)",
        type: "number",
        min: 5,
        max: 120,
        step: 1,
      },
      {
        name: "batchSize",
        label: "Batch size (students)",
        type: "number",
        min: 1,
        max: 500,
        step: 1,
      },
    ],
    schema: z
      .object({
        slotMinutes: z
          .number()
          .int("Use a whole number of minutes")
          .min(5, "Minimum slot is 5 minutes")
          .max(120),
        batchSize: z
          .number()
          .int("Use a whole number")
          .min(1, "Batch size must be at least 1")
          .max(500),
      })
      .strict(),
    defaults: { slotMinutes: 15, batchSize: 50 },
    summarize: (c) =>
      "Slot " + c.slotMinutes + " min, batch size " + c.batchSize,
  },
];
export const RULE_BY_KEY = new Map(RULE_DEFINITIONS.map((d) => [d.key, d]));
