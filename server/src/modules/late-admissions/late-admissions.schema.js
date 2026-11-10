import { z } from "zod";

// CNIC may come with dashes (42101-1234567-8), we keep only the digits.
const cnic = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v === "" || v.length === 13, "CNIC must have 13 digits");


const text = (max) => z.string().trim().max(max).default("");


export const resolveSchema = z
  .object({
    name: z.string().trim().max(100),
    fatherName: text(100),
    gender: z.enum(["M", "F", ""]).default(""),
    cnic,
    passport: text(30),
    mobile: text(30),
    email: z
      .string()
      .trim()
      .max(150)
      .refine((v) => v === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Email is not valid")
      .default(""),
    formNo: text(20),
    externalStudentId: text(30),
    uniName: text(150),
    degreeTitle: text(150),
    passingYear: z.number().int().min(1950).max(2100).nullable().optional(),
    obtainedMarks: z.number().min(0, "Obtained marks cannot be negative"),
    totalMarks: z.number().positive("Total marks must be more than 0"),
    realRollNo: z
      .string()
      .trim()
      .min(3, "Real roll number is missing")
      .max(30)
      .transform((v) => v.toUpperCase()),
    existingStudentId: z.number().int().positive().nullable().optional(),
  })
  .refine((d) => d.obtainedMarks <= d.totalMarks, {
    path: ["obtainedMarks"],
    message: "Obtained marks are more than total marks",
  })
  .refine((d) => d.existingStudentId || d.cnic !== "" || d.passport !== "", {
    path: ["cnic"],
    message: "CNIC or passport is required for a new student",
  })
  .refine((d) => d.existingStudentId || d.name.length >= 2, {
    path: ["name"],
    message: "Name is too short",
  });
