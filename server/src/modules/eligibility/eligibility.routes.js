import { Router } from "express";
import { validate } from "../../middleware/validate-request.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { requirePermission } from "../../middleware/require-permission.js";
import { previewSchema, runSchema } from "./eligibility.schema.js";
import { list, ruleVersions, preview, run, exportList } from "./eligibility.controller.js";
 
const router = Router();
router.use(requireAuth, requirePermission("eligibility.manage"));
 
router.get("/", list);
router.get("/rule-versions", ruleVersions);
router.get("/export", exportList);
router.post("/preview", validate(previewSchema), preview);
router.post("/run", validate(runSchema), run);
 
export default router;