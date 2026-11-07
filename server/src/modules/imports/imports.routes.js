import { Router } from "express";
import { validate } from "../../middleware/validate-request.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { requirePermission } from "../../middleware/require-permission.js";
import { uploadFile } from "./imports.upload.js";
import { previewSchema, importSchema, doneSchema } from "./imports.schema.js";
import { list, preview, create, done } from "./imports.controller.js";
 
const router = Router();
router.use(requireAuth, requirePermission("import.manage"));
 
router.get("/", list);
router.post("/preview", uploadFile, validate(previewSchema), preview);
router.post("/", uploadFile, validate(importSchema), create);
router.post("/done", validate(doneSchema), done);
 
export default router;
