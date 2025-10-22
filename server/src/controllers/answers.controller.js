import { pool } from "../config/db.js";

// ======================================================
// POST /api/answers  (Guardar intento + respuestas)
// Body: { topic_id: number, answers: [{ question_id, option_id? }] }
// ======================================================
export const saveAnswers = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    const { topic_id, answers } = req.body || {};
    if (!topic_id || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Faltan topic_id o answers" });
    }

    // Normalizar entradas
    const clean = answers
      .filter((a) => a && typeof a.question_id === "number")
      .map((a) => ({
        question_id: Number(a.question_id),
        option_id: a.option_id != null ? Number(a.option_id) : null,
      }));

    const total = clean.length;

    // Resolver corrección de las option_id provistas en un solo query
    const optionIds = clean.map((a) => a.option_id).filter((id) => id != null);
    let correctnessByOption = new Map();
    if (optionIds.length > 0) {
      const placeholders = optionIds.map(() => "?").join(",");
      const [optRows] = await pool.query(
        `SELECT id, is_correct FROM options WHERE id IN (${placeholders})`,
        optionIds
      );
      for (const r of optRows) correctnessByOption.set(r.id, !!r.is_correct);
    }

    // Calcular score y preparar inserción de respuestas
    let score = 0;
    const answersRows = clean.map((a) => {
      const isCorrect = a.option_id != null ? !!correctnessByOption.get(a.option_id) : null;
      if (isCorrect === true) score += 1;
      return [a.question_id, a.option_id, isCorrect];
    });

    // Transacción: crear intento + insertar respuestas
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [attRes] = await conn.query(
        `INSERT INTO attempts (user_id, topic_id, mode, score, started_at, submitted_at)
         VALUES (?,?,?,?, NOW(), NOW())`,
        [userId, Number(topic_id), "practice", score]
      );
      const attemptId = attRes.insertId;

      if (answersRows.length > 0) {
        const values = answersRows.map(() => "(?,?,?,?)").join(",");
        const flat = [];
        for (const row of answersRows) {
          flat.push(attemptId, row[0], row[1], row[2]);
        }
        await conn.query(
          `INSERT INTO attempt_answers (attempt_id, question_id, option_id, is_correct)
           VALUES ${values}`,
          flat
        );
      }

      await conn.commit();

      const accuracy_pct = total > 0 ? Math.round((score * 1000) / total) / 10 : 0;
      return res.status(201).json({ ok: true, attempt_id: attemptId, score, total, accuracy_pct });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Error en POST /answers:", err);
    return res.status(500).json({ error: "No se pudo guardar el intento" });
  }
};

// ======================================================
// GET /api/answers/history  (Historial del usuario)
// ======================================================
export const getAnswerHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    const [rows] = await pool.query(
      `SELECT 
         a.id              AS attempt_id,
         t.name            AS topic_name,
         a.score           AS score,
         a.started_at      AS started_at,
         a.submitted_at    AS submitted_at,
         COUNT(aa.question_id) AS total_questions,
         CASE WHEN COUNT(aa.question_id) > 0 
              THEN ROUND(a.score * 100.0 / COUNT(aa.question_id), 1)
              ELSE 0 END AS accuracy_pct
       FROM attempts a
       JOIN topics t ON t.id = a.topic_id
       LEFT JOIN attempt_answers aa ON aa.attempt_id = a.id
       WHERE a.user_id = ?
       GROUP BY a.id
       ORDER BY a.submitted_at DESC, a.id DESC`,
      [userId]
    );

    return res.json({ ok: true, attempts: rows });
  } catch (err) {
    console.error("Error en GET /answers/history:", err);
    return res.status(500).json({ error: "No se pudo obtener el historial" });
  }
};

// ======================================================
// GET /api/answers/:attemptId  (Detalle de intento)
// ======================================================
// Devuelve metadatos del intento + cada pregunta con:
// - alternativa seleccionada
// - alternativas disponibles (marcando correcta y seleccionada)
export const getAttemptDetail = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    const attemptId = Number(req.params.attemptId);
    if (!attemptId) return res.status(400).json({ error: "attemptId inválido" });

    // 1) Verificar que el intento exista y pertenezca al usuario
    const [attRows] = await pool.query(
      `SELECT a.id, a.user_id, a.mode, a.topic_id, a.score, a.started_at, a.submitted_at,
              t.name AS topic_name
         FROM attempts a
         JOIN topics  t ON t.id = a.topic_id
        WHERE a.id = ? AND a.user_id = ?`,
      [attemptId, userId]
    );
    const attempt = attRows[0];
    if (!attempt) return res.status(404).json({ error: "Intento no encontrado" });

    // 2) Respuestas del intento (pregunta + opción seleccionada + correctness)
    const [ansRows] = await pool.query(
      `SELECT 
          aa.question_id,
          aa.option_id         AS selected_option_id,
          aa.is_correct        AS selected_is_correct,
          q.stem,
          q.explanation
       FROM attempt_answers aa
       JOIN questions q ON q.id = aa.question_id
       WHERE aa.attempt_id = ?
       ORDER BY q.id ASC`,
      [attemptId]
    );

    if (ansRows.length === 0) {
      return res.json({
        ok: true,
        attempt: {
          id: attempt.id,
          mode: attempt.mode,
          topic_id: attempt.topic_id,
          topic_name: attempt.topic_name,
          score: Number(attempt.score ?? 0),
          started_at: attempt.started_at,
          submitted_at: attempt.submitted_at,
          total: 0,
          accuracy_pct: 0,
        },
        items: [],
      });
    }

    // 3) Traer TODAS las opciones de esas preguntas en un solo query
    const qIds = ansRows.map((r) => r.question_id);
    const placeholders = qIds.map(() => "?").join(",");
    const [optRows] = await pool.query(
      `SELECT id, question_id, label, text, is_correct
         FROM options
        WHERE question_id IN (${placeholders})
        ORDER BY question_id ASC, label ASC`,
      qIds
    );

    // 4) Agrupar opciones por pregunta
    const groupedOptions = new Map(); // question_id -> opciones[]
    for (const o of optRows) {
      if (!groupedOptions.has(o.question_id)) groupedOptions.set(o.question_id, []);
      groupedOptions.get(o.question_id).push({
        id: o.id,
        label: o.label,
        text: o.text,
        is_correct: !!o.is_correct,
      });
    }

    const items = ansRows.map((r) => {
      const opts = groupedOptions.get(r.question_id) || [];
      const selectedId = r.selected_option_id ? Number(r.selected_option_id) : null;
      const options = opts.map((o) => ({
        ...o,
        is_selected: selectedId === o.id,
      }));

    return {
        question_id: r.question_id,
        stem: r.stem,
        explanation: r.explanation,
        selected_option_id: selectedId,
        is_correct: r.selected_is_correct === 1 ? true : r.selected_is_correct === 0 ? false : null,
        options,
      };
    });

    const total = items.length;
    const score = Number(attempt.score ?? 0);
    const accuracy_pct = total > 0 ? Math.round((score * 1000) / total) / 10 : 0;

    return res.json({
      ok: true,
      attempt: {
        id: attempt.id,
        mode: attempt.mode,
        topic_id: attempt.topic_id,
        topic_name: attempt.topic_name,
        score,
        started_at: attempt.started_at,
        submitted_at: attempt.submitted_at,
        total,
        accuracy_pct,
      },
      items,
    });
  } catch (err) {
    console.error("Error en GET /answers/:attemptId:", err);
    return res.status(500).json({ error: "Error al obtener detalle del intento" });
  }
};

// ======================================================
// GET /api/answers/summary  (NUEVO)
// Resumen global del usuario (intentados, precisión promedio,
// temas practicados, mejor/peor tema en práctica)
// ======================================================
export const getAnswersSummary = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    // 1) Intentos totales
    const [totalRows] = await pool.query(
      `SELECT COUNT(*) AS total_attempts
         FROM attempts
        WHERE user_id = ?`,
      [userId]
    );
    const total_attempts = Number(totalRows?.[0]?.total_attempts ?? 0);

    // 2) Precisión promedio por intento
    const [avgRows] = await pool.query(
      `SELECT CAST(ROUND(AVG(acc), 1) AS DOUBLE) AS avg_accuracy
         FROM (
           SELECT (100 * a.score / NULLIF(COUNT(aa.id), 0)) AS acc
             FROM attempts a
             LEFT JOIN attempt_answers aa ON aa.attempt_id = a.id
            WHERE a.user_id = ?
            GROUP BY a.id
         ) t`,
      [userId]
    );
    const avg_accuracy = Number(avgRows?.[0]?.avg_accuracy ?? 0);

    // 3) Cantidad de temas practicados (solo mode='practice')
    const [topicsRows] = await pool.query(
      `SELECT COUNT(DISTINCT a.topic_id) AS topics_practiced
         FROM attempts a
        WHERE a.user_id = ? AND a.mode = 'practice' AND a.topic_id IS NOT NULL`,
      [userId]
    );
    const topics_practiced = Number(topicsRows?.[0]?.topics_practiced ?? 0);

    // 4) Mejor/peor tema (solo practice) por accuracy acumulada
    const [topicStats] = await pool.query(
      `SELECT 
          t.id   AS topic_id,
          t.name AS topic_name,
          CAST(ROUND(100 * SUM(a.score) / NULLIF(SUM(qs.total_q), 0), 1) AS DOUBLE) AS accuracy_pct
        FROM attempts a
        JOIN (
          SELECT attempt_id, COUNT(*) AS total_q
            FROM attempt_answers
           GROUP BY attempt_id
        ) qs ON qs.attempt_id = a.id
        JOIN topics t ON t.id = a.topic_id
       WHERE a.user_id = ?
         AND a.mode = 'practice'
         AND a.topic_id IS NOT NULL
       GROUP BY t.id
       HAVING SUM(qs.total_q) > 0`,
      [userId]
    );

    let best_topic = null;
    let worst_topic = null;

    if (topicStats.length > 0) {
      const sorted = [...topicStats].sort((a, b) => b.accuracy_pct - a.accuracy_pct);
      best_topic = {
        topic_id: Number(sorted[0].topic_id),
        name: String(sorted[0].topic_name),
        accuracy: Number(sorted[0].accuracy_pct),
      };
      const last = sorted[sorted.length - 1];
      worst_topic = {
        topic_id: Number(last.topic_id),
        name: String(last.topic_name),
        accuracy: Number(last.accuracy_pct),
      };
    }

    return res.json({
      ok: true,
      total_attempts,
      avg_accuracy,
      topics_practiced,
      best_topic,
      worst_topic,
    });
  } catch (err) {
    console.error("Error en GET /answers/summary:", err);
    return res.status(500).json({ error: "Error al obtener resumen" });
  }
};

// ======================================================
// GET /api/answers/stats/topics  (Precisión por tema)
// Query: ?limit=8 (1..20) opcional
// ======================================================
export const getTopicStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    const limitQ = Number.parseInt(String(req.query.limit ?? "8"), 10);
    const limit = Number.isFinite(limitQ) ? Math.min(Math.max(limitQ, 1), 20) : 8;

    const [rows] = await pool.query(
      `
      SELECT
        a.topic_id,
        t.name AS topic_name,
        COUNT(DISTINCT a.id) AS attempts,
        COUNT(aa.id) AS total_questions,
        SUM(CASE WHEN aa.is_correct = 1 THEN 1 ELSE 0 END) AS correct_answers,
        CAST(
          ROUND(
            100 * SUM(CASE WHEN aa.is_correct = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(aa.id), 0),
            1
          ) AS DOUBLE
        ) AS accuracy_pct,
        MAX(COALESCE(a.submitted_at, a.started_at)) AS last_practiced
      FROM attempts a
      LEFT JOIN attempt_answers aa ON aa.attempt_id = a.id
      INNER JOIN topics t          ON t.id = a.topic_id
      WHERE a.user_id = ?
      GROUP BY a.topic_id, t.name
      ORDER BY accuracy_pct DESC, attempts DESC
      LIMIT ?
      `,
      [userId, limit]
    );

    return res.json({ ok: true, stats: rows, limit });
  } catch (err) {
    console.error("❌ Error en GET /answers/stats/topics:", err);
    return res.status(500).json({ error: "No se pudo obtener estadísticas por tema" });
  }
};

