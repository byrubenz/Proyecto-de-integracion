// server/src/controllers/exams.controller.js
import { pool } from "../config/db.js";

/* ================= Helper de expiración (nuevo) ================= */
async function getAttemptAndExpiry(attemptId, userId) {
  const [attRows] = await pool.query(
    `SELECT id, user_id, started_at, submitted_at, time_limit_seconds
       FROM attempts
      WHERE id = ? AND user_id = ? AND mode='exam'`,
    [attemptId, userId]
  );
  const att = attRows[0];
  if (!att) return { att: null, expired: false };

  const [[nowRow]] = await pool.query(`SELECT NOW() AS server_now`);
  const [[elapsedRow]] = await pool.query(
    `SELECT TIMESTAMPDIFF(SECOND, ?, ?) AS elapsed_seconds`,
    [att.started_at, nowRow.server_now]
  );
  const elapsed = Number(elapsedRow?.elapsed_seconds ?? 0);
  const expired = att.time_limit_seconds != null && elapsed >= Number(att.time_limit_seconds);

  return { att, expired };
}

/**
 * POST /api/exams/start
 * body: {
 *   title?: string,
 *   time_limit_seconds?: number,   // ej: 7200 (2h)
 *   sections: Array<{ topic_id: number, count: number }>
 * }
 */
export const startExam = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    const { title = "Ensayo", time_limit_seconds = null, sections = [] } = req.body || {};
    if (!Array.isArray(sections) || sections.length === 0) {
      return res.status(400).json({ error: "Debes indicar secciones (topic_id, count)" });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1) Crear attempt en modo exam
      const [attRes] = await conn.query(
        `INSERT INTO attempts (user_id, topic_id, mode, score, started_at, title, time_limit_seconds)
         VALUES (?, NULL, 'exam', 0, NOW(), ?, ?)`,
        [userId, title, time_limit_seconds]
      );
      const attemptId = attRes.insertId;

      // 2) Seleccionar preguntas por sección (topic)
      let pickedQuestions = [];
      for (const sec of sections) {
        const topicId = Number(sec.topic_id);
        const count = Math.max(1, Number(sec.count || 1));

        const [qs] = await conn.query(
          `SELECT id FROM questions WHERE topic_id = ? ORDER BY RAND() LIMIT ?`,
          [topicId, count]
        );
        pickedQuestions.push(...qs.map(q => ({ question_id: q.id })));
      }

      // Deduplicar por seguridad
      const seen = new Set();
      pickedQuestions = pickedQuestions.filter(q => {
        if (seen.has(q.question_id)) return false;
        seen.add(q.question_id);
        return true;
      });

      if (pickedQuestions.length === 0) {
        await conn.rollback();
        return res.status(400).json({ error: "No se encontraron preguntas para este ensayo" });
      }

      // 3) Pre-crear filas en attempt_answers (no respondidas)
      const values = pickedQuestions.map(() => "(?,?,NULL,NULL)").join(",");
      const flat = [];
      for (const pq of pickedQuestions) flat.push(attRes.insertId, pq.question_id);

      await conn.query(
        `INSERT INTO attempt_answers (attempt_id, question_id, option_id, is_correct)
         VALUES ${values}`,
        flat
      );

      await conn.commit();

      return res.status(201).json({
        ok: true,
        attempt_id: attemptId,
        title,
        time_limit_seconds,
        total_questions: pickedQuestions.length,
      });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("❌ startExam error:", err);
    res.status(500).json({ error: "No se pudo iniciar el ensayo" });
  }
};

/**
 * POST /api/exams/:attemptId/answer
 * body: { question_id: number, option_id: number|null }
 * Guarda/actualiza respuesta y recalcula is_correct para esa pregunta
 */
export const answerExam = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No autorizado" });
    const attemptId = Number(req.params.attemptId);
    const { question_id, option_id } = req.body || {};
    if (!attemptId || !question_id) return res.status(400).json({ error: "Datos inválidos" });

    // ✅ Validar ownership, estado y expiración (NUEVO)
    const { att, expired } = await getAttemptAndExpiry(attemptId, userId);
    if (!att) return res.status(404).json({ error: "Ensayo no encontrado" });
    if (att.submitted_at) return res.status(400).json({ error: "Ensayo ya finalizado" });
    if (expired) return res.status(400).json({ error: "Tiempo expirado: no se aceptan más respuestas" });

    // Validar pertenencia de la pregunta
    const [chkRows] = await pool.query(
      `SELECT 1 FROM attempt_answers WHERE attempt_id = ? AND question_id = ?`,
      [attemptId, Number(question_id)]
    );
    if (chkRows.length === 0) {
      return res.status(400).json({ error: "La pregunta no pertenece a este intento" });
    }

    let isCorrect = null;
    if (option_id != null) {
      const [oRows] = await pool.query(
        `SELECT is_correct FROM options WHERE id = ? AND question_id = ?`,
        [Number(option_id), Number(question_id)]
      );
      isCorrect = oRows.length > 0 ? (oRows[0].is_correct ? 1 : 0) : 0;
    }

    await pool.query(
      `UPDATE attempt_answers 
          SET option_id = ?, is_correct = ?
        WHERE attempt_id = ? AND question_id = ?`,
      [option_id ?? null, isCorrect, attemptId, Number(question_id)]
    );

    res.json({ ok: true, question_id: Number(question_id), option_id: option_id ?? null });
  } catch (err) {
    console.error("❌ answerExam error:", err);
    res.status(500).json({ error: "No se pudo guardar la respuesta" });
  }
};

/**
 * POST /api/exams/:attemptId/finish
 * Cierra el examen, calcula score y (opcional) duration_seconds
 * body: { duration_seconds?: number }
 */
export const finishExam = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No autorizado" });
    const attemptId = Number(req.params.attemptId);
    const { duration_seconds = null } = req.body || {};
    if (!attemptId) return res.status(400).json({ error: "attemptId inválido" });

    // ✅ Verificar ownership y estado (si expiró, igual dejamos cerrar) (NUEVO)
    const { att } = await getAttemptAndExpiry(attemptId, userId);
    if (!att) return res.status(404).json({ error: "Ensayo no encontrado" });
    if (att.submitted_at) return res.status(400).json({ error: "Ensayo ya finalizado" });

    // Calcular score desde attempt_answers
    const [sRows] = await pool.query(
      `SELECT 
          COUNT(*) AS total,
          SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correctas
         FROM attempt_answers
        WHERE attempt_id = ?`,
      [attemptId]
    );
    const total = Number(sRows[0]?.total ?? 0);
    const score = Number(sRows[0]?.correctas ?? 0);

    await pool.query(
      `UPDATE attempts
          SET score = ?, submitted_at = NOW(), duration_seconds = COALESCE(?, duration_seconds)
        WHERE id = ?`,
      [score, duration_seconds, attemptId]
    );

    const accuracy_pct = total > 0 ? Math.round((score * 1000) / total) / 10 : 0;
    res.json({ ok: true, attempt_id: attemptId, score, total, accuracy_pct });
  } catch (err) {
    console.error("❌ finishExam error:", err);
    res.status(500).json({ error: "No se pudo finalizar el examen" });
  }
};

/**
 * GET /api/exams/:attemptId/result
 * Resumen final + items (similar a getAttemptDetail pero para 'exam')
 */
export const getExamResult = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No autorizado" });
    const attemptId = Number(req.params.attemptId);
    if (!attemptId) return res.status(400).json({ error: "attemptId inválido" });

    // Attempt
    const [attRows] = await pool.query(
      `SELECT id, user_id, title, score, started_at, submitted_at, time_limit_seconds, duration_seconds
         FROM attempts
        WHERE id = ? AND user_id = ? AND mode='exam'`,
      [attemptId, userId]
    );
    const att = attRows[0];
    if (!att) return res.status(404).json({ error: "Ensayo no encontrado" });

    // Answers + questions + options
    const [ansRows] = await pool.query(
      `SELECT aa.question_id, aa.option_id AS selected_option_id, aa.is_correct AS selected_is_correct,
              q.stem, q.explanation
         FROM attempt_answers aa
         JOIN questions q ON q.id = aa.question_id
        WHERE aa.attempt_id = ?
        ORDER BY q.id ASC`,
      [attemptId]
    );

    const qIds = ansRows.map(r => r.question_id);
    const placeholders = qIds.map(() => "?").join(",");
    const [optRows] = qIds.length
      ? await pool.query(
          `SELECT id, question_id, label, text, is_correct
             FROM options
            WHERE question_id IN (${placeholders})
            ORDER BY question_id ASC, label ASC`,
          qIds
        )
      : [ [] ];

    const group = new Map();
    for (const o of optRows) {
      if (!group.has(o.question_id)) group.set(o.question_id, []);
      group.get(o.question_id).push({
        id: o.id, label: o.label, text: o.text, is_correct: !!o.is_correct
      });
    }

    const items = ansRows.map(r => {
      const selectedId = r.selected_option_id ? Number(r.selected_option_id) : null;
      const options = (group.get(r.question_id) || []).map(o => ({
        id: o.id, label: o.label, text: o.text, is_correct: o.is_correct,
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
    const score = Number(att.score ?? 0);
    const accuracy_pct = total > 0 ? Math.round((score * 1000) / total) / 10 : 0;

    res.json({
      ok: true,
      attempt: {
        id: att.id,
        title: att.title,
        score,
        started_at: att.started_at,
        submitted_at: att.submitted_at,
        duration_seconds: att.duration_seconds,
        time_limit_seconds: att.time_limit_seconds,
        total,
        accuracy_pct,
      },
      items,
    });
  } catch (err) {
    console.error("❌ getExamResult error:", err);
    res.status(500).json({ error: "No se pudo obtener el resultado del examen" });
  }
};

// ======================================================
// GET /api/exams/:attemptId/detail  (Revisión por pregunta)
// ======================================================
export const getExamDetail = async (req, res) => {
  try {
    const userId = req.user?.id;
    const attemptId = Number(req.params.attemptId);
    if (!userId) return res.status(401).json({ error: "No autorizado" });
    if (!attemptId) return res.status(400).json({ error: "attemptId inválido" });

    // Verifica que el intento exista, sea del usuario y sea de modo 'exam'
    const [attRows] = await pool.query(
      `SELECT a.id, a.user_id, a.mode, a.score, a.started_at, a.submitted_at, a.title, a.time_limit_seconds
         FROM attempts a
        WHERE a.id = ? AND a.user_id = ? AND a.mode = 'exam'`,
      [attemptId, userId]
    );
    const attempt = attRows[0];
    if (!attempt) return res.status(404).json({ error: "Intento no encontrado" });

    // Respuestas del intento
    const [ansRows] = await pool.query(
      `SELECT 
         aa.question_id,
         aa.option_id AS selected_option_id,
         aa.is_correct AS selected_is_correct,
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
          title: attempt.title ?? null,
          score: Number(attempt.score ?? 0),
          started_at: attempt.started_at,
          submitted_at: attempt.submitted_at,
          time_limit_seconds: attempt.time_limit_seconds ?? null,
          total: 0,
          accuracy_pct: 0,
        },
        items: [],
      });
    }

    // Traer todas las opciones de esas preguntas
    const qIds = ansRows.map(r => r.question_id);
    const placeholders = qIds.map(() => "?").join(",");
    const [optRows] = await pool.query(
      `SELECT id, question_id, label, text, is_correct
         FROM options
        WHERE question_id IN (${placeholders})
        ORDER BY question_id ASC, label ASC`,
      qIds
    );

    const byQ = new Map();
    for (const o of optRows) {
      if (!byQ.has(o.question_id)) byQ.set(o.question_id, []);
      byQ.get(o.question_id).push({
        id: o.id,
        label: o.label,
        text: o.text,
        is_correct: !!o.is_correct,
      });
    }

    const items = ansRows.map(r => {
      const selectedId = r.selected_option_id ? Number(r.selected_option_id) : null;
      const options = (byQ.get(r.question_id) || []).map(o => ({
        ...o,
        is_selected: o.id === selectedId,
      }));
      return {
        question_id: r.question_id,
        stem: r.stem,
        explanation: r.explanation,
        selected_option_id: selectedId,
        is_correct:
          r.selected_is_correct === 1 ? true :
          r.selected_is_correct === 0 ? false : null,
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
        title: attempt.title ?? null,
        score,
        started_at: attempt.started_at,
        submitted_at: attempt.submitted_at,
        time_limit_seconds: attempt.time_limit_seconds ?? null,
        total,
        accuracy_pct,
      },
      items,
    });
  } catch (err) {
    console.error("Error en GET /exams/:attemptId/detail:", err);
    return res.status(500).json({ error: "Error al obtener el detalle del examen" });
  }
};

/**
 * GET /api/exams/:attemptId/progress
 * (versión extendida con server_now, elapsed_seconds, expired)
 */
export const getExamProgress = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No autorizado" });
    const attemptId = Number(req.params.attemptId);
    if (!attemptId) return res.status(400).json({ error: "attemptId inválido" });

    // Attempt
    const [attRows] = await pool.query(
      `SELECT id, user_id, title, time_limit_seconds, started_at, submitted_at
         FROM attempts
        WHERE id = ? AND user_id = ? AND mode = 'exam'`,
      [attemptId, userId]
    );
    const att = attRows[0];
    if (!att) return res.status(404).json({ error: "Ensayo no encontrado" });

    // ⏱️ Hora del servidor + elapsed_seconds
    const [[nowRow]] = await pool.query(`SELECT NOW() AS server_now`);
    const server_now = nowRow.server_now;
    const [[elapsedRow]] = await pool.query(
      `SELECT TIMESTAMPDIFF(SECOND, ?, ?) AS elapsed_seconds`,
      [att.started_at, server_now]
    );
    const elapsed_seconds = Number(elapsedRow?.elapsed_seconds ?? 0);
    const expired =
      att.time_limit_seconds != null &&
      elapsed_seconds >= Number(att.time_limit_seconds) &&
      !att.submitted_at;

    // Preguntas seleccionadas
    const [ansRows] = await pool.query(
      `SELECT aa.question_id, aa.option_id AS selected_option_id
         FROM attempt_answers aa
        WHERE aa.attempt_id = ?
        ORDER BY aa.question_id ASC`,
      [attemptId]
    );
    const qIds = ansRows.map(r => r.question_id);
    if (qIds.length === 0) {
      return res.json({
        ok: true,
        attempt: att,
        items: [],
        answered: 0,
        total: 0,
        server_now,
        elapsed_seconds,
        expired
      });
    }

    // Traer enunciados y opciones
    const placeholders = qIds.map(() => "?").join(",");
    const [qRows] = await pool.query(
      `SELECT id, stem FROM questions WHERE id IN (${placeholders}) ORDER BY id ASC`,
      qIds
    );
    const [optRows] = await pool.query(
      `SELECT id, question_id, label, text
         FROM options
        WHERE question_id IN (${placeholders})
        ORDER BY question_id ASC, label ASC`,
      qIds
    );

    const optionsByQ = new Map();
    for (const o of optRows) {
      if (!optionsByQ.has(o.question_id)) optionsByQ.set(o.question_id, []);
      optionsByQ.get(o.question_id).push({
        id: o.id, label: o.label, text: o.text
      });
    }

    const items = qRows.map(q => {
      const sel = ansRows.find(a => a.question_id === q.id)?.selected_option_id ?? null;
      return {
        question_id: q.id,
        stem: q.stem,
        options: optionsByQ.get(q.id) || [],
        selected_option_id: sel ? Number(sel) : null,
      };
    });

    const answered = ansRows.filter(r => r.selected_option_id != null).length;

    res.json({
      ok: true,
      attempt: {
        id: att.id,
        title: att.title,
        time_limit_seconds: att.time_limit_seconds,
        started_at: att.started_at,
        submitted_at: att.submitted_at,
      },
      items,
      answered,
      total: items.length,
      server_now,
      elapsed_seconds,
      expired
    });
  } catch (err) {
    console.error("❌ getExamProgress error:", err);
    res.status(500).json({ error: "No se pudo obtener el progreso" });
  }
};

// ======================================================
// GET /api/exams/active  (ensayos en curso)
// ======================================================
export const getActiveExams = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    const [rows] = await pool.query(
      `SELECT 
         id,
         title,
         started_at,
         time_limit_seconds
       FROM attempts
       WHERE user_id = ?
         AND mode = 'exam'
         AND submitted_at IS NULL
       ORDER BY started_at DESC`,
      [userId]
    );

    return res.json({ ok: true, active: rows });
  } catch (err) {
    console.error("❌ getActiveExams error:", err);
    return res.status(500).json({ error: "No se pudo obtener ensayos activos" });
  }
};

// ======================================================
// GET /api/exams/history?limit=10&offset=0  (historial de ensayos)
// ======================================================
export const getExamHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    const limitQ = Number.parseInt(String(req.query.limit ?? "10"), 10);
    const offsetQ = Number.parseInt(String(req.query.offset ?? "0"), 10);
    const limit = Number.isFinite(limitQ) ? Math.min(Math.max(limitQ, 1), 100) : 10;
    const offset = Number.isFinite(offsetQ) ? Math.max(offsetQ, 0) : 0;

    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) AS total
         FROM attempts
        WHERE user_id = ?
          AND mode = 'exam'
          AND submitted_at IS NOT NULL`,
      [userId]
    );
    const total = Number(countRow?.total ?? 0);

    const [rows] = await pool.query(
      `SELECT 
         a.id                  AS attempt_id,
         a.title               AS title,
         a.score               AS score,
         a.started_at          AS started_at,
         a.submitted_at        AS submitted_at,
         a.duration_seconds    AS duration_seconds,
         a.time_limit_seconds  AS time_limit_seconds,
         COUNT(aa.question_id) AS total_questions,
         CASE WHEN COUNT(aa.question_id) > 0
              THEN ROUND(a.score * 100.0 / COUNT(aa.question_id), 1)
              ELSE 0 END        AS accuracy_pct
       FROM attempts a
       LEFT JOIN attempt_answers aa ON aa.attempt_id = a.id
       WHERE a.user_id = ?
         AND a.mode = 'exam'
         AND a.submitted_at IS NOT NULL
       GROUP BY a.id
       ORDER BY a.submitted_at DESC, a.id DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    return res.json({
      ok: true,
      exams: rows,
      total_exams: total,
      page: Math.floor(offset / limit) + 1,
      page_size: limit,
      has_more: offset + limit < total,
    });
  } catch (err) {
    console.error("❌ getExamHistory error:", err);
    return res.status(500).json({ error: "No se pudo obtener historial de ensayos" });
  }
};

// ======================================================
// POST /api/exams/:attemptId/retake  (rehacer con misma composición)
// ======================================================
export const retakeExam = async (req, res) => {
  try {
    const userId = req.user?.id;
    const baseAttemptId = Number(req.params.attemptId);
    if (!userId) return res.status(401).json({ error: "No autorizado" });
    if (!baseAttemptId) return res.status(400).json({ error: "attemptId inválido" });

    // Traer el intento base
    const [attRows] = await pool.query(
      `SELECT id, user_id, title, time_limit_seconds, mode
         FROM attempts
        WHERE id = ? AND user_id = ? AND mode = 'exam'`,
      [baseAttemptId, userId]
    );
    const att = attRows[0];
    if (!att) return res.status(404).json({ error: "Ensayo base no encontrado" });

    // Contar cuántas preguntas por topic tenía ese intento
    const [mixRows] = await pool.query(
      `SELECT q.topic_id, COUNT(*) AS cnt
         FROM attempt_answers aa
         JOIN questions q ON q.id = aa.question_id
        WHERE aa.attempt_id = ?
        GROUP BY q.topic_id`,
      [baseAttemptId]
    );
    if (mixRows.length === 0) {
      return res.status(400).json({ error: "No se pudo inferir la composición de temas" });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Crear nuevo intento (mismo título + sufijo) y mismo time_limit_seconds
      const newTitle = `${att.title ?? "Ensayo"} (reintento)`;
      const [attRes] = await conn.query(
        `INSERT INTO attempts (user_id, topic_id, mode, score, started_at, title, time_limit_seconds)
         VALUES (?, NULL, 'exam', 0, NOW(), ?, ?)`,
        [userId, newTitle, att.time_limit_seconds ?? null]
      );
      const newAttemptId = attRes.insertId;

      // Seleccionar nuevas preguntas por cada topic con la misma cantidad
      let picked = [];
      for (const row of mixRows) {
        const topicId = Number(row.topic_id);
        const count = Math.max(1, Number(row.cnt || 1));
        const [qs] = await conn.query(
          `SELECT id FROM questions WHERE topic_id = ? ORDER BY RAND() LIMIT ?`,
          [topicId, count]
        );
        picked.push(...qs.map(q => ({ question_id: q.id })));
      }

      // Deduplicar por si acaso
      const seen = new Set();
      picked = picked.filter(p => {
        if (seen.has(p.question_id)) return false;
        seen.add(p.question_id);
        return true;
      });

      if (picked.length === 0) {
        await conn.rollback();
        return res.status(400).json({ error: "No se encontraron preguntas para el reintento" });
      }

      // Pre-crear respuestas
      const values = picked.map(() => "(?,?,NULL,NULL)").join(",");
      const flat = [];
      for (const pq of picked) flat.push(newAttemptId, pq.question_id);
      await conn.query(
        `INSERT INTO attempt_answers (attempt_id, question_id, option_id, is_correct)
         VALUES ${values}`,
        flat
      );

      await conn.commit();

      return res.status(201).json({
        ok: true,
        attempt_id: newAttemptId,
        title: newTitle,
        time_limit_seconds: att.time_limit_seconds ?? null,
        total_questions: picked.length,
      });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("❌ retakeExam error:", err);
    return res.status(500).json({ error: "No se pudo rehacer el ensayo" });
  }
};
