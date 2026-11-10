import { Router } from "express";
import { validate } from "../../middleware/validate-request.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { requirePermission } from "../../middleware/require-permission.js";
import { resolveSchema } from "./late-admissions.schema.js";
import { list, match, resolve } from "./late-admissions.controller.js";
 
const router = Router();
 
router.use(requireAuth, requirePermission("late.manage"));
router.get("/", list);
router.get("/match", match);
router.post("/:applicationId/resolve", validate(resolveSchema), resolve);
 
export default router;
