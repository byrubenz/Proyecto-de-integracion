// server/src/routes/answers.routes.js
import { Router } from "express";
import {
  saveAnswers,
  getAnswerHistory,
  getAttemptDetail,
  getAnswersSummary,
  getTopicStats, // ✅ agregado aquí en el mismo import
} from "../controllers/answers.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/answers", requireAuth, saveAnswers);

// ✅ Rutas específicas primero (evita que :attemptId capture /stats/topics)
router.get("/answers/history", requireAuth, getAnswerHistory);
router.get("/answers/summary", requireAuth, getAnswersSummary);
router.get("/answers/stats/topics", requireAuth, getTopicStats);

// ✅ Paramétrica al final
router.get("/answers/:attemptId", requireAuth, getAttemptDetail);

// (opcional) ping
router.get("/answers/ping", requireAuth, (req, res) => {
  res.json({ ok: true, user_id: req.user.id });
});

export default router;


