import { Router } from "express";
import { previewNemRanking } from "../controllers/nemRanking.controller.js";

const router = Router();

// POST /api/nem-ranking/preview
router.post("/nem-ranking/preview", previewNemRanking);

export default router;
