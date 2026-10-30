import { Router } from "express";
import { login, logout, me } from "./auth.controller.js";
import { loginSchema } from "./auth.schema.js";
import { validate } from "../../middleware/validate-request.js";
import { requireAuth } from "../../middleware/require-auth.js";
 
const router = Router();
 
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
 
export default router;
