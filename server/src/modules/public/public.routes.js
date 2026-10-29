import { Router } from "express";
import { summary } from "./public.controller.js";


const router = Router();
router.get("/summary", summary);


export default router;
