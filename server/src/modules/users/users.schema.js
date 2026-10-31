import { z } from "zod";
 
const username = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(50)
  .regex(/^[a-z0-9._-]+$/, "Use only letters, numbers, dot, dash or underscore");
 
const fullName = z.string().trim().min(2, "Name is required").max(100);
 
const email = z
  .union([z.string().trim().toLowerCase().email("Invalid email"), z.literal("")])
  .optional();
 
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100);
 
const roleIds = z
  .array(z.number().int().positive())
  .min(1, "Select at least one role");
 
export const createUserSchema = z.object({
  username,
  fullName,
  email,
  password,
  roleIds,
});
 
export const updateUserSchema = z.object({
  fullName,
  email,
  password: password.optional(),
  roleIds,
});
 
export const statusSchema = z.object({
  isActive: z.boolean(),
});
