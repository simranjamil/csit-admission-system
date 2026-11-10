import { Router } from "express";
import { validate } from "../../middleware/validate-request.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { requirePermission } from "../../middleware/require-permission.js";
import { uploadFile } from "./result-imports.upload.js";
import { previewSchema, importSchema, doneSchema } from "./result-imports.schema.js";
import { overview, rows, preview, create, done } from "./result-imports.controller.js";
 
const router = Router();
 
router.use(requireAuth, requirePermission("results.manage"));
router.get("/", overview);
router.get("/rows", rows);
router.post("/preview", uploadFile, validate(previewSchema), preview);
router.post("/", uploadFile, validate(importSchema), create);
router.post("/done", validate(doneSchema), done);
 
export default router;
