import { Router } from "express";
import { getQuestionsByTopic } from "../controllers/questions.controller.js";

const router = Router();

router.get("/topics/:id/questions", getQuestionsByTopic);

export default router;
