// server/src/routes/profile.routes.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getProfile, updateProfile, changePassword } from "../controllers/profile.controller.js";

const router = Router();

router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);
router.put("/profile/password", requireAuth, changePassword);

export default router;
