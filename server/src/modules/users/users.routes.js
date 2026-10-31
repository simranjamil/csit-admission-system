import { Router } from "express";
import { validate } from "../../middleware/validate-request.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { requirePermission } from "../../middleware/require-permission.js";
import { createUserSchema, updateUserSchema, statusSchema } from "./users.schema.js";
import { list, roles, create, update, setStatus } from "./users.controller.js";
 
const router = Router();
 
router.use(requireAuth, requirePermission("user.manage"));
 
router.get("/roles", roles);
router.get("/", list);
router.post("/", validate(createUserSchema), create);
router.patch("/:id", validate(updateUserSchema), update);
router.patch("/:id/status", validate(statusSchema), setStatus);
 
export default router;
