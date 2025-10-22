import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getAllTopicsSimple } from "../controllers/topics.controller.js";

const router = Router();
router.get("/topics/all", requireAuth, getAllTopicsSimple);
export default router;
