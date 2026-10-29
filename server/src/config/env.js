import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(5000),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
});


const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid .env:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
