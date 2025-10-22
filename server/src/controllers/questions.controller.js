import { pool } from "../config/db.js";

export const getQuestionsByTopic = async (req, res) => {
  try {
    const { id } = req.params;

    const [questions] = await pool.query(
      "SELECT id, stem, difficulty, explanation FROM questions WHERE topic_id = ?",
      [id]
    );

    if (questions.length === 0) {
      return res.status(404).json({ message: "No se encontraron preguntas para este tema" });
    }

    const questionIds = questions.map((q) => q.id);

    const [options] = await pool.query(
      "SELECT id, question_id, label, text, is_correct FROM options WHERE question_id IN (?)",
      [questionIds]
    );

    const result = questions.map((q) => ({
      ...q,
      options: options.filter((o) => o.question_id === q.id),
    }));

    res.json(result);
  } catch (error) {
    console.error("❌ Error en GET /topics/:id/questions:", error);
    res.status(500).json({ error: "Error al obtener las preguntas del tema" });
  }
};

