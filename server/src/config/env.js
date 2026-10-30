import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(5000),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid .env:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
