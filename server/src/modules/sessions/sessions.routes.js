import { Router } from "express";
import { validate } from "../../middleware/validate-request.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { requirePermission } from "../../middleware/require-permission.js";
import {
  createSessionSchema,
  updateSessionSchema,
  statusSchema,
  optionsSchema,
} from "./sessions.schema.js";
import {
  list,
  create,
  update,
  setStatus,
  getOptions,
  saveOptions,
} from "./sessions.controller.js";
const router = Router();
router.use(requireAuth, requirePermission("setup.manage"));
router.get("/", list);
router.post("/", validate(createSessionSchema), create);
router.patch("/:id", validate(updateSessionSchema), update);
router.patch("/:id/status", validate(statusSchema), setStatus);
router.get("/:id/options", getOptions);
router.put("/:id/options", validate(optionsSchema), saveOptions);
export default router;
