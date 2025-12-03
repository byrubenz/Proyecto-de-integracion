import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import {
  adminSummary,
  adminListUsers,
  adminUpdateUserRole,
  adminGetUnits,
  adminCreateUnit,
  adminUpdateUnit,
  adminDeleteUnit,
  adminListTopics,
  adminCreateTopic,
  adminUpdateTopic,
  adminDeleteTopic,
  adminListQuestions,
  adminCreateQuestion,
  adminUpdateQuestion,
  adminDeleteQuestion,
  adminAddOption,
  adminUpdateOption,
  adminDeleteOption,
  adminListExams,
  adminCreateExam,
  adminUpdateExam,
  adminDeleteExam,
  adminGetExamQuestions,
  adminSetExamQuestions,
  adminListAttempts,
  adminGetAttemptDetail,
  adminListEvents,
} from "../controllers/admin.controller.js";

const router = Router();

// Dashboard
router.get("/admin/summary", requireAdmin, adminSummary);

// Usuarios
router.get("/admin/users", requireAdmin, adminListUsers);
router.patch("/admin/users/:id/role", requireAdmin, adminUpdateUserRole);

// Unidades y topics
router.get("/admin/units", requireAdmin, adminGetUnits);
router.post("/admin/units", requireAdmin, adminCreateUnit);
router.put("/admin/units/:id", requireAdmin, adminUpdateUnit);
router.delete("/admin/units/:id", requireAdmin, adminDeleteUnit);

router.get("/admin/topics", requireAdmin, adminListTopics);
router.post("/admin/topics", requireAdmin, adminCreateTopic);
router.put("/admin/topics/:id", requireAdmin, adminUpdateTopic);
router.delete("/admin/topics/:id", requireAdmin, adminDeleteTopic);

// Preguntas y opciones
router.get("/admin/questions", requireAdmin, adminListQuestions);
router.post("/admin/questions", requireAdmin, adminCreateQuestion);
router.put("/admin/questions/:id", requireAdmin, adminUpdateQuestion);
router.delete("/admin/questions/:id", requireAdmin, adminDeleteQuestion);

router.post("/admin/questions/:id/options", requireAdmin, adminAddOption);
router.put("/admin/options/:id", requireAdmin, adminUpdateOption);
router.delete("/admin/options/:id", requireAdmin, adminDeleteOption);

// Examenes
router.get("/admin/exams", requireAdmin, adminListExams);
router.post("/admin/exams", requireAdmin, adminCreateExam);
router.put("/admin/exams/:id", requireAdmin, adminUpdateExam);
router.delete("/admin/exams/:id", requireAdmin, adminDeleteExam);
router.get("/admin/exams/:id/questions", requireAdmin, adminGetExamQuestions);
router.put("/admin/exams/:id/questions", requireAdmin, adminSetExamQuestions);

// Intentos
router.get("/admin/attempts", requireAdmin, adminListAttempts);
router.get("/admin/attempts/:id", requireAdmin, adminGetAttemptDetail);

// Eventos
router.get("/admin/events", requireAdmin, adminListEvents);

export default router;
