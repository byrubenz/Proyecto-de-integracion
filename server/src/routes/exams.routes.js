// server/src/routes/exams.routes.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  startExam,
  getExamProgress,
  answerExam,
  finishExam,
  getExamResult,
  getExamDetail,
  // 👇 nuevos
  getActiveExams,
  getExamHistory,
  retakeExam,
} from "../controllers/exams.controller.js";

const router = Router();

// Rutas estáticas primero (evita ambigüedad con paramétricas)
router.get("/exams/active", requireAuth, getActiveExams);
router.get("/exams/history", requireAuth, getExamHistory);

// Crea un intento 'exam'
router.post("/exams/start", requireAuth, startExam);

// Rehacer ensayo (clona composición del intento previo)
router.post("/exams/:attemptId/retake", requireAuth, retakeExam);

// Progreso
router.get("/exams/:attemptId/progress", requireAuth, getExamProgress);

// Guardar respuesta
router.post("/exams/:attemptId/answer", requireAuth, answerExam);

// Finalizar
router.post("/exams/:attemptId/finish", requireAuth, finishExam);

// Resultado
router.get("/exams/:attemptId/result", requireAuth, getExamResult);

// Detalle/Revisión
router.get("/exams/:attemptId/detail", requireAuth, getExamDetail);

export default router;
