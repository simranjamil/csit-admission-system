import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/database.js";

async function start() {
  await prisma.$connect();
  console.log("Database connected");
  app.listen(env.PORT, () => console.log(`API running on http://localhost:${env.PORT}`));
}

start().catch((e) => {
  console.error("Startup failed:", e);
  process.exit(1);
});
