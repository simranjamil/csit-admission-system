import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import publicRoutes from "./modules/public/public.routes.js";
import { notFound, errorHandler } from "./middleware/error-handler.js";


const app = express();


app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());


app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/public", publicRoutes);


app.use(notFound);
app.use(errorHandler);


export default app;
