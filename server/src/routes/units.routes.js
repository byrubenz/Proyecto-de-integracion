import { Router } from "express";
import { getUnits } from "../controllers/units.controller.js";

const router = Router();

router.get("/units", getUnits); // 👈 queda /api/units al montarlo en app.js

export default router;

