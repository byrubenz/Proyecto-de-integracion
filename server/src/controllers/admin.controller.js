
import { pool } from "../config/db.js";

// Util simple de paginacion
function parsePagination(req, defLimit = 20, maxLimit = 100) {
  const limitQ = Number.parseInt(String(req.query.limit ?? defLimit), 10);
  const offsetQ = Number.parseInt(String(req.query.offset ?? 0), 10);
  const limit = Number.isFinite(limitQ) ? Math.min(Math.max(limitQ, 1), maxLimit) : defLimit;
  const offset = Number.isFinite(offsetQ) ? Math.max(offsetQ, 0) : 0;
  const page = Math.floor(offset / limit) + 1;
  return { limit, offset, page };
}

/* =====================================================
 * Dashboard de Admin
 * ===================================================== */
export const adminSummary = async (req, res) => {
  try {
    const [[counts]] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM users)      AS users,
         (SELECT COUNT(*) FROM units)      AS units,
         (SELECT COUNT(*) FROM topics)     AS topics,
         (SELECT COUNT(*) FROM questions)  AS questions,
         (SELECT COUNT(*) FROM exams)      AS exams`
    );

    const [attempts] = await pool.query(
      `SELECT
         a.id,
         a.user_id,
         u.name  AS user_name,
         u.email AS user_email,
         a.mode,
         a.score,
         a.started_at,
         a.submitted_at,
         a.exam_id,
         e.name AS exam_name,
         a.topic_id,
         t.name AS topic_name
       FROM attempts a
       LEFT JOIN users u  ON u.id = a.user_id
       LEFT JOIN exams e  ON e.id = a.exam_id
       LEFT JOIN topics t ON t.id = a.topic_id
       ORDER BY a.started_at DESC
       LIMIT 10`
    );

    const [events] = await pool.query(
      `SELECT
         ae.id,
         ae.user_id,
         u.email AS user_email,
         ae.event_type,
         ae.created_at
       FROM analytics_events ae
       LEFT JOIN users u ON u.id = ae.user_id
       ORDER BY ae.created_at DESC
       LIMIT 10`
    );

    return res.json({ ok: true, counts, last_attempts: attempts, last_events: events });
  } catch (err) {
    console.error("adminSummary error:", err);
    return res.status(500).json({ error: "No se pudo cargar el resumen" });
  }
};

/* =====================================================
 * Usuarios
 * ===================================================== */
export const adminListUsers = async (req, res) => {
  try {
    const { limit, offset, page } = parsePagination(req, 20, 200);
    const search = String(req.query.search ?? "").trim();

    const params = [];
    const conds = [];
    if (search) {
      conds.push("(u.name LIKE ? OR u.email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    const where = conds.length > 0 ? `WHERE ${conds.join(" AND ")}` : "";

    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) AS total FROM users u ${where}`,
      params
    );
    const total = Number(countRow?.total ?? 0);

    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at, u.updated_at
         FROM users u
         ${where}
         ORDER BY u.created_at DESC
         LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.json({
      ok: true,
      users: rows,
      total,
      page,
      page_size: limit,
      has_more: offset + limit < total,
    });
  } catch (err) {
    console.error("adminListUsers error:", err);
    return res.status(500).json({ error: "No se pudieron listar usuarios" });
  }
};

export const adminUpdateUserRole = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body || {};
    if (!userId) return res.status(400).json({ error: "id invalido" });
    if (role !== "admin" && role !== "student") {
      return res.status(400).json({ error: "Rol invalido" });
    }

    const [result] = await pool.query(
      `UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?`,
      [role, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    return res.json({ ok: true, id: userId, role });
  } catch (err) {
    console.error("adminUpdateUserRole error:", err);
    return res.status(500).json({ error: "No se pudo actualizar el rol" });
  }
};
/* =====================================================
 * Unidades y Temas
 * ===================================================== */
export const adminGetUnits = async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         u.id   AS unit_id,
         u.name AS unit_name,
         u.order_idx AS unit_order,
         t.id   AS topic_id,
         t.name AS topic_name,
         t.order_idx AS topic_order
       FROM units u
       LEFT JOIN topics t ON t.unit_id = u.id
       ORDER BY u.order_idx ASC, t.order_idx ASC`
    );

    const units = [];
    for (const r of rows) {
      let u = units.find((x) => x.id === r.unit_id);
      if (!u) {
        u = { id: r.unit_id, name: r.unit_name, order_idx: r.unit_order, topics: [] };
        units.push(u);
      }
      if (r.topic_id) {
        u.topics.push({
          id: r.topic_id,
          name: r.topic_name,
          order_idx: r.topic_order,
        });
      }
    }
    return res.json({ ok: true, units });
  } catch (err) {
    console.error("adminGetUnits error:", err);
    return res.status(500).json({ error: "No se pudieron obtener las unidades" });
  }
};

export const adminCreateUnit = async (req, res) => {
  try {
    const { name, order_idx } = req.body || {};
    if (!name || order_idx == null) {
      return res.status(400).json({ error: "Faltan name u order_idx" });
    }
    const order = Number(order_idx);
    if (!Number.isInteger(order)) {
      return res.status(400).json({ error: "order_idx debe ser entero" });
    }

    const [dupes] = await pool.query(
      `SELECT id FROM units WHERE order_idx = ?`,
      [order]
    );
    if (dupes.length > 0) {
      return res.status(400).json({ error: "order_idx ya esta en uso" });
    }

    const [result] = await pool.query(
      `INSERT INTO units (name, order_idx) VALUES (?, ?)`,
      [String(name).trim(), order]
    );
    return res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error("adminCreateUnit error:", err);
    return res.status(500).json({ error: "No se pudo crear la unidad" });
  }
};

export const adminUpdateUnit = async (req, res) => {
  try {
    const unitId = Number(req.params.id);
    if (!unitId) return res.status(400).json({ error: "id invalido" });

    const { name, order_idx } = req.body || {};
    const fields = [];
    const params = [];

    if (name) {
      fields.push("name = ?");
      params.push(String(name).trim());
    }

    if (order_idx != null) {
      const order = Number(order_idx);
      if (!Number.isInteger(order)) {
        return res.status(400).json({ error: "order_idx debe ser entero" });
      }
      const [dupes] = await pool.query(
        `SELECT id FROM units WHERE order_idx = ? AND id <> ?`,
        [order, unitId]
      );
      if (dupes.length > 0) {
        return res.status(400).json({ error: "order_idx ya esta en uso" });
      }
      fields.push("order_idx = ?");
      params.push(order);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    params.push(unitId);
    const [result] = await pool.query(
      `UPDATE units SET ${fields.join(", ")} WHERE id = ?`,
      params
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Unidad no encontrada" });

    return res.json({ ok: true });
  } catch (err) {
    console.error("adminUpdateUnit error:", err);
    return res.status(500).json({ error: "No se pudo actualizar la unidad" });
  }
};

export const adminDeleteUnit = async (req, res) => {
  try {
    const unitId = Number(req.params.id);
    if (!unitId) return res.status(400).json({ error: "id invalido" });

    const [[countTopics]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM topics WHERE unit_id = ?`,
      [unitId]
    );
    if (Number(countTopics?.cnt ?? 0) > 0) {
      return res.status(400).json({ error: "La unidad tiene topics asociados" });
    }

    const [result] = await pool.query(`DELETE FROM units WHERE id = ?`, [unitId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Unidad no encontrada" });

    return res.json({ ok: true });
  } catch (err) {
    console.error("adminDeleteUnit error:", err);
    return res.status(500).json({ error: "No se pudo eliminar la unidad" });
  }
};

export const adminListTopics = async (req, res) => {
  try {
    const unitId = req.query.unit_id ? Number(req.query.unit_id) : null;
    const params = [];
    let where = "";
    if (unitId) {
      where = "WHERE t.unit_id = ?";
      params.push(unitId);
    }

    const [rows] = await pool.query(
      `SELECT 
         t.id,
         t.unit_id,
         t.name,
         t.order_idx,
         u.name AS unit_name
       FROM topics t
       JOIN units u ON u.id = t.unit_id
       ${where}
       ORDER BY u.order_idx ASC, t.order_idx ASC, t.id ASC`,
      params
    );

    return res.json({ ok: true, topics: rows });
  } catch (err) {
    console.error("adminListTopics error:", err);
    return res.status(500).json({ error: "No se pudieron listar los topics" });
  }
};

export const adminCreateTopic = async (req, res) => {
  try {
    const { unit_id, name, order_idx } = req.body || {};
    if (!unit_id || !name || order_idx == null) {
      return res.status(400).json({ error: "Faltan unit_id, name u order_idx" });
    }
    const unitId = Number(unit_id);
    const order = Number(order_idx);
    if (!Number.isInteger(unitId) || !Number.isInteger(order)) {
      return res.status(400).json({ error: "unit_id y order_idx deben ser enteros" });
    }

    const [existsUnit] = await pool.query(`SELECT id FROM units WHERE id = ?`, [unitId]);
    if (existsUnit.length === 0) return res.status(404).json({ error: "Unidad no encontrada" });

    const [dupes] = await pool.query(
      `SELECT id FROM topics WHERE unit_id = ? AND order_idx = ?`,
      [unitId, order]
    );
    if (dupes.length > 0) {
      return res.status(400).json({ error: "order_idx ya esta en uso en la unidad" });
    }

    const [result] = await pool.query(
      `INSERT INTO topics (unit_id, name, order_idx) VALUES (?,?,?)`,
      [unitId, String(name).trim(), order]
    );
    return res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error("adminCreateTopic error:", err);
    return res.status(500).json({ error: "No se pudo crear el topic" });
  }
};

export const adminUpdateTopic = async (req, res) => {
  try {
    const topicId = Number(req.params.id);
    if (!topicId) return res.status(400).json({ error: "id invalido" });

    const [currentRows] = await pool.query(
      `SELECT id, unit_id FROM topics WHERE id = ?`,
      [topicId]
    );
    const current = currentRows[0];
    if (!current) return res.status(404).json({ error: "Topic no encontrado" });

    const { unit_id, name, order_idx } = req.body || {};
    const fields = [];
    const params = [];

    const targetUnit = unit_id != null ? Number(unit_id) : current.unit_id;
    if (unit_id != null && !Number.isInteger(targetUnit)) {
      return res.status(400).json({ error: "unit_id debe ser entero" });
    }
    if (unit_id != null) {
      const [existsUnit] = await pool.query(`SELECT id FROM units WHERE id = ?`, [targetUnit]);
      if (existsUnit.length === 0) return res.status(404).json({ error: "Unidad no encontrada" });
      fields.push("unit_id = ?");
      params.push(targetUnit);
    }

    if (name) {
      fields.push("name = ?");
      params.push(String(name).trim());
    }

    if (order_idx != null) {
      const order = Number(order_idx);
      if (!Number.isInteger(order)) {
        return res.status(400).json({ error: "order_idx debe ser entero" });
      }
      const [dupes] = await pool.query(
        `SELECT id FROM topics WHERE unit_id = ? AND order_idx = ? AND id <> ?`,
        [targetUnit, order, topicId]
      );
      if (dupes.length > 0) {
        return res.status(400).json({ error: "order_idx ya esta en uso en la unidad" });
      }
      fields.push("order_idx = ?");
      params.push(order);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    params.push(topicId);
    const [result] = await pool.query(
      `UPDATE topics SET ${fields.join(", ")} WHERE id = ?`,
      params
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Topic no encontrado" });

    return res.json({ ok: true });
  } catch (err) {
    console.error("adminUpdateTopic error:", err);
    return res.status(500).json({ error: "No se pudo actualizar el topic" });
  }
};

export const adminDeleteTopic = async (req, res) => {
  try {
    const topicId = Number(req.params.id);
    if (!topicId) return res.status(400).json({ error: "id invalido" });

    const [[countQ]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM questions WHERE topic_id = ?`,
      [topicId]
    );
    if (Number(countQ?.cnt ?? 0) > 0) {
      return res.status(400).json({ error: "El topic tiene preguntas asociadas" });
    }

    const [result] = await pool.query(`DELETE FROM topics WHERE id = ?`, [topicId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Topic no encontrado" });

    return res.json({ ok: true });
  } catch (err) {
    console.error("adminDeleteTopic error:", err);
    return res.status(500).json({ error: "No se pudo eliminar el topic" });
  }
};
/* =====================================================
 * Preguntas y opciones
 * ===================================================== */
function sanitizeOption(opt) {
  if (!opt) return null;
  const label = String(opt.label ?? "").trim().toUpperCase();
  const text = String(opt.text ?? "").trim();
  const isCorrect = opt.is_correct ? 1 : 0;
  if (!label || !text) return null;
  return {
    id: opt.id ? Number(opt.id) : null,
    label: label.slice(0, 1),
    text,
    is_correct: isCorrect,
  };
}

export const adminListQuestions = async (req, res) => {
  try {
    const { limit, offset, page } = parsePagination(req, 15, 200);
    const unitId = req.query.unit_id ? Number(req.query.unit_id) : null;
    const topicId = req.query.topic_id ? Number(req.query.topic_id) : null;
    const difficulty = req.query.difficulty ? Number(req.query.difficulty) : null;
    const search = String(req.query.search ?? "").trim();

    const params = [];
    const conds = ["1=1"];
    if (unitId) { conds.push("u.id = ?"); params.push(unitId); }
    if (topicId) { conds.push("q.topic_id = ?"); params.push(topicId); }
    if (difficulty) { conds.push("q.difficulty = ?"); params.push(difficulty); }
    if (search) {
      conds.push("(q.stem LIKE ? OR t.name LIKE ? OR u.name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const where = conds.join(" AND ");

    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) AS total
         FROM questions q
         JOIN topics t ON t.id = q.topic_id
         JOIN units u  ON u.id = t.unit_id
        WHERE ${where}`,
      params
    );
    const total = Number(countRow?.total ?? 0);

    const [rows] = await pool.query(
      `SELECT 
         q.id,
         q.topic_id,
         q.stem,
         q.difficulty,
         q.explanation,
         t.name AS topic_name,
         u.id   AS unit_id,
         u.name AS unit_name
       FROM questions q
       JOIN topics t ON t.id = q.topic_id
       JOIN units u  ON u.id = t.unit_id
       WHERE ${where}
       ORDER BY u.order_idx ASC, t.order_idx ASC, q.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const ids = rows.map((r) => r.id);
    const optionsByQ = new Map();
    if (ids.length > 0) {
      const placeholders = ids.map(() => "?").join(",");
      const [optRows] = await pool.query(
        `SELECT id, question_id, label, text, is_correct
           FROM options
          WHERE question_id IN (${placeholders})
          ORDER BY question_id ASC, label ASC`,
        ids
      );
      for (const o of optRows) {
        if (!optionsByQ.has(o.question_id)) optionsByQ.set(o.question_id, []);
        optionsByQ.get(o.question_id).push({
          id: o.id,
          label: o.label,
          text: o.text,
          is_correct: !!o.is_correct,
        });
      }
    }

    const questions = rows.map((r) => ({
      ...r,
      options: optionsByQ.get(r.id) || [],
    }));

    return res.json({
      ok: true,
      questions,
      total,
      page,
      page_size: limit,
      has_more: offset + limit < total,
    });
  } catch (err) {
    console.error("adminListQuestions error:", err);
    return res.status(500).json({ error: "No se pudieron listar las preguntas" });
  }
};

export const adminCreateQuestion = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { topic_id, stem, difficulty, explanation = null, options = [] } = req.body || {};
    if (!topic_id || !stem || difficulty == null) {
      conn.release();
      return res.status(400).json({ error: "Faltan topic_id, stem o difficulty" });
    }

    const topicId = Number(topic_id);
    const diff = Number(difficulty);
    if (!Number.isInteger(topicId) || ![1, 2, 3].includes(diff)) {
      conn.release();
      return res.status(400).json({ error: "Datos invalidos para topic_id o difficulty" });
    }

    const [topicRows] = await conn.query(`SELECT id FROM topics WHERE id = ?`, [topicId]);
    if (topicRows.length === 0) {
      conn.release();
      return res.status(404).json({ error: "Topic no encontrado" });
    }

    const cleaned = Array.isArray(options) ? options.map(sanitizeOption).filter(Boolean) : [];
    if (cleaned.length === 0) {
      conn.release();
      return res.status(400).json({ error: "Debes incluir opciones" });
    }
    const labels = new Set(cleaned.map((o) => o.label));
    if (labels.size !== cleaned.length) {
      conn.release();
      return res.status(400).json({ error: "Las labels de opciones deben ser unicas" });
    }
    const correctCount = cleaned.filter((o) => o.is_correct).length;
    if (correctCount > 1) {
      conn.release();
      return res.status(400).json({ error: "Solo una opcion puede ser correcta" });
    }

    await conn.beginTransaction();
    const [qRes] = await conn.query(
      `INSERT INTO questions (topic_id, stem, difficulty, explanation) VALUES (?,?,?,?)`,
      [topicId, String(stem).trim(), diff, explanation ?? null]
    );
    const questionId = qRes.insertId;

    const values = cleaned.map(() => "(?,?,?,?)").join(",");
    const flat = [];
    for (const o of cleaned) {
      flat.push(questionId, o.label, o.text, o.is_correct ? 1 : 0);
    }
    await conn.query(
      `INSERT INTO options (question_id, label, text, is_correct) VALUES ${values}`,
      flat
    );

    if (correctCount === 1) {
      const correctLabel = cleaned.find((o) => o.is_correct)?.label;
      await conn.query(
        `UPDATE options SET is_correct = CASE WHEN label = ? THEN 1 ELSE 0 END WHERE question_id = ?`,
        [correctLabel, questionId]
      );
    }

    await conn.commit();
    return res.status(201).json({ ok: true, id: questionId });
  } catch (err) {
    await conn.rollback();
    console.error("adminCreateQuestion error:", err);
    return res.status(500).json({ error: "No se pudo crear la pregunta" });
  } finally {
    conn.release();
  }
};
export const adminUpdateQuestion = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const questionId = Number(req.params.id);
    if (!questionId) {
      conn.release();
      return res.status(400).json({ error: "id invalido" });
    }

    const { topic_id, stem, difficulty, explanation = null, options } = req.body || {};

    const [qRows] = await conn.query(
      `SELECT id, topic_id FROM questions WHERE id = ?`,
      [questionId]
    );
    const q = qRows[0];
    if (!q) {
      conn.release();
      return res.status(404).json({ error: "Pregunta no encontrada" });
    }

    const targetTopic = topic_id != null ? Number(topic_id) : q.topic_id;
    if (topic_id != null) {
      const [tRows] = await conn.query(`SELECT id FROM topics WHERE id = ?`, [targetTopic]);
      if (tRows.length === 0) {
        conn.release();
        return res.status(404).json({ error: "Topic no encontrado" });
      }
    }

    const fields = [];
    const params = [];
    if (topic_id != null) { fields.push("topic_id = ?"); params.push(targetTopic); }
    if (stem) { fields.push("stem = ?"); params.push(String(stem).trim()); }
    if (difficulty != null) {
      const diff = Number(difficulty);
      if (![1, 2, 3].includes(diff)) {
        conn.release();
        return res.status(400).json({ error: "difficulty debe ser 1, 2 o 3" });
      }
      fields.push("difficulty = ?");
      params.push(diff);
    }
    if (explanation !== undefined) { fields.push("explanation = ?"); params.push(explanation ?? null); }

    await conn.beginTransaction();
    if (fields.length > 0) {
      params.push(questionId);
      await conn.query(`UPDATE questions SET ${fields.join(", ")} WHERE id = ?`, params);
    }

    if (options !== undefined) {
      const cleaned = Array.isArray(options) ? options.map(sanitizeOption).filter(Boolean) : [];
      if (cleaned.length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ error: "Debes incluir al menos una opcion" });
      }

      const labels = new Set(cleaned.map((o) => o.label));
      if (labels.size !== cleaned.length) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ error: "Las labels de opciones deben ser unicas" });
      }
      const correctCount = cleaned.filter((o) => o.is_correct).length;
      if (correctCount > 1) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ error: "Solo una opcion puede ser correcta" });
      }

      const [currentOptRows] = await conn.query(
        `SELECT id FROM options WHERE question_id = ?`,
        [questionId]
      );
      const currentIds = currentOptRows.map((r) => r.id);

      const incomingIds = cleaned.filter((o) => o.id).map((o) => Number(o.id));
      const toDelete = currentIds.filter((id) => !incomingIds.includes(id));
      if (toDelete.length > 0) {
        const placeholders = toDelete.map(() => "?").join(",");
        const [[used]] = await conn.query(
          `SELECT COUNT(*) AS cnt FROM attempt_answers WHERE option_id IN (${placeholders})`,
          toDelete
        );
        if (Number(used?.cnt ?? 0) > 0) {
          await conn.rollback();
          conn.release();
          return res.status(400).json({ error: "No puedes eliminar opciones ya respondidas" });
        }
        await conn.query(
          `DELETE FROM options WHERE id IN (${placeholders})`,
          toDelete
        );
      }

      let correctOptionId = null;
      for (const o of cleaned) {
        if (o.id && currentIds.includes(o.id)) {
          await conn.query(
            `UPDATE options SET label = ?, text = ?, is_correct = ? WHERE id = ? AND question_id = ?`,
            [o.label, o.text, o.is_correct ? 1 : 0, o.id, questionId]
          );
          if (o.is_correct) correctOptionId = o.id;
        } else {
          const [optRes] = await conn.query(
            `INSERT INTO options (question_id, label, text, is_correct) VALUES (?,?,?,?)`,
            [questionId, o.label, o.text, o.is_correct ? 1 : 0]
          );
          if (o.is_correct) correctOptionId = optRes.insertId;
        }
      }

      if (correctOptionId) {
        await conn.query(
          `UPDATE options SET is_correct = CASE WHEN id = ? THEN 1 ELSE 0 END WHERE question_id = ?`,
          [correctOptionId, questionId]
        );
      } else {
        await conn.query(
          `UPDATE options SET is_correct = 0 WHERE question_id = ?`,
          [questionId]
        );
      }
    }

    await conn.commit();
    return res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    console.error("adminUpdateQuestion error:", err);
    return res.status(500).json({ error: "No se pudo actualizar la pregunta" });
  } finally {
    conn.release();
  }
};

export const adminDeleteQuestion = async (req, res) => {
  try {
    const questionId = Number(req.params.id);
    if (!questionId) return res.status(400).json({ error: "id invalido" });

    const [result] = await pool.query(`DELETE FROM questions WHERE id = ?`, [questionId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Pregunta no encontrada" });

    return res.json({ ok: true });
  } catch (err) {
    console.error("adminDeleteQuestion error:", err);
    return res.status(500).json({ error: "No se pudo eliminar la pregunta" });
  }
};

export const adminAddOption = async (req, res) => {
  try {
    const questionId = Number(req.params.id);
    const { label, text, is_correct = 0 } = req.body || {};
    if (!questionId || !label || !text) {
      return res.status(400).json({ error: "Faltan datos de opcion" });
    }
    const clean = sanitizeOption({ label, text, is_correct });
    if (!clean) return res.status(400).json({ error: "Opcion invalida" });

    const [existsQ] = await pool.query(`SELECT id FROM questions WHERE id = ?`, [questionId]);
    if (existsQ.length === 0) return res.status(404).json({ error: "Pregunta no encontrada" });

    const [[labelUsed]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM options WHERE question_id = ? AND label = ?`,
      [questionId, clean.label]
    );
    if (Number(labelUsed?.cnt ?? 0) > 0) {
      return res.status(400).json({ error: "Label ya existe en la pregunta" });
    }

    const [optRes] = await pool.query(
      `INSERT INTO options (question_id, label, text, is_correct) VALUES (?,?,?,?)`,
      [questionId, clean.label, clean.text, clean.is_correct ? 1 : 0]
    );

    if (clean.is_correct) {
      await pool.query(
        `UPDATE options SET is_correct = CASE WHEN id = ? THEN 1 ELSE 0 END WHERE question_id = ?`,
        [optRes.insertId, questionId]
      );
    }

    return res.status(201).json({ ok: true, id: optRes.insertId });
  } catch (err) {
    console.error("adminAddOption error:", err);
    return res.status(500).json({ error: "No se pudo crear la opcion" });
  }
};

export const adminUpdateOption = async (req, res) => {
  try {
    const optionId = Number(req.params.id);
    if (!optionId) return res.status(400).json({ error: "id invalido" });

    const { label, text, is_correct } = req.body || {};
    if (label == null && text == null && is_correct == null) {
      return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    const [optRows] = await pool.query(
      `SELECT id, question_id FROM options WHERE id = ?`,
      [optionId]
    );
    const opt = optRows[0];
    if (!opt) return res.status(404).json({ error: "Opcion no encontrada" });

    const fields = [];
    const params = [];
    if (label != null) { fields.push("label = ?"); params.push(String(label).trim().toUpperCase().slice(0, 1)); }
    if (text != null) { fields.push("text = ?"); params.push(String(text).trim()); }
    if (is_correct != null) { fields.push("is_correct = ?"); params.push(is_correct ? 1 : 0); }

    params.push(optionId);
    await pool.query(
      `UPDATE options SET ${fields.join(", ")} WHERE id = ?`,
      params
    );

    if (is_correct != null && is_correct) {
      await pool.query(
        `UPDATE options SET is_correct = CASE WHEN id = ? THEN 1 ELSE 0 END WHERE question_id = ?`,
        [optionId, opt.question_id]
      );
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("adminUpdateOption error:", err);
    return res.status(500).json({ error: "No se pudo actualizar la opcion" });
  }
};

export const adminDeleteOption = async (req, res) => {
  try {
    const optionId = Number(req.params.id);
    if (!optionId) return res.status(400).json({ error: "id invalido" });

    const [[used]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM attempt_answers WHERE option_id = ?`,
      [optionId]
    );
    if (Number(used?.cnt ?? 0) > 0) {
      return res.status(400).json({ error: "La opcion ya fue respondida en intentos" });
    }

    const [result] = await pool.query(`DELETE FROM options WHERE id = ?`, [optionId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Opcion no encontrada" });

    return res.json({ ok: true });
  } catch (err) {
    console.error("adminDeleteOption error:", err);
    return res.status(500).json({ error: "No se pudo eliminar la opcion" });
  }
};
/* =====================================================
 * Examenes
 * ===================================================== */
export const adminListExams = async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         e.id,
         e.name,
         e.duration_minutes,
         COUNT(eq.question_id) AS questions_count
       FROM exams e
       LEFT JOIN exam_questions eq ON eq.exam_id = e.id
       GROUP BY e.id
       ORDER BY e.id DESC`
    );
    return res.json({ ok: true, exams: rows });
  } catch (err) {
    console.error("adminListExams error:", err);
    return res.status(500).json({ error: "No se pudieron listar los examenes" });
  }
};

export const adminCreateExam = async (req, res) => {
  try {
    const { name, duration_minutes } = req.body || {};
    if (!name || duration_minutes == null) {
      return res.status(400).json({ error: "Faltan name o duration_minutes" });
    }
    const duration = Number(duration_minutes);
    if (!Number.isInteger(duration) || duration <= 0) {
      return res.status(400).json({ error: "duration_minutes debe ser un entero > 0" });
    }

    const [result] = await pool.query(
      `INSERT INTO exams (name, duration_minutes) VALUES (?, ?)`,
      [String(name).trim(), duration]
    );
    return res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error("adminCreateExam error:", err);
    return res.status(500).json({ error: "No se pudo crear el examen" });
  }
};

export const adminUpdateExam = async (req, res) => {
  try {
    const examId = Number(req.params.id);
    if (!examId) return res.status(400).json({ error: "id invalido" });

    const { name, duration_minutes } = req.body || {};
    const fields = [];
    const params = [];
    if (name) { fields.push("name = ?"); params.push(String(name).trim()); }
    if (duration_minutes != null) {
      const duration = Number(duration_minutes);
      if (!Number.isInteger(duration) || duration <= 0) {
        return res.status(400).json({ error: "duration_minutes debe ser entero > 0" });
      }
      fields.push("duration_minutes = ?");
      params.push(duration);
    }
    if (fields.length === 0) return res.status(400).json({ error: "No hay campos para actualizar" });

    params.push(examId);
    const [result] = await pool.query(
      `UPDATE exams SET ${fields.join(", ")} WHERE id = ?`,
      params
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Examen no encontrado" });

    return res.json({ ok: true });
  } catch (err) {
    console.error("adminUpdateExam error:", err);
    return res.status(500).json({ error: "No se pudo actualizar el examen" });
  }
};

export const adminDeleteExam = async (req, res) => {
  try {
    const examId = Number(req.params.id);
    if (!examId) return res.status(400).json({ error: "id invalido" });

    const [[usedAttempts]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM attempts WHERE exam_id = ?`,
      [examId]
    );
    if (Number(usedAttempts?.cnt ?? 0) > 0) {
      return res.status(400).json({ error: "El examen tiene intentos asociados" });
    }

    await pool.query(`DELETE FROM exam_questions WHERE exam_id = ?`, [examId]);
    const [result] = await pool.query(`DELETE FROM exams WHERE id = ?`, [examId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Examen no encontrado" });

    return res.json({ ok: true });
  } catch (err) {
    console.error("adminDeleteExam error:", err);
    return res.status(500).json({ error: "No se pudo eliminar el examen" });
  }
};

export const adminGetExamQuestions = async (req, res) => {
  try {
    const examId = Number(req.params.id);
    if (!examId) return res.status(400).json({ error: "id invalido" });

    const [rows] = await pool.query(
      `SELECT 
         eq.question_id,
         eq.order_idx,
         q.stem,
         q.difficulty,
         t.name AS topic_name,
         u.name AS unit_name
       FROM exam_questions eq
       JOIN questions q ON q.id = eq.question_id
       JOIN topics t    ON t.id = q.topic_id
       JOIN units u     ON u.id = t.unit_id
       WHERE eq.exam_id = ?
       ORDER BY eq.order_idx ASC`,
      [examId]
    );
    return res.json({ ok: true, questions: rows });
  } catch (err) {
    console.error("adminGetExamQuestions error:", err);
    return res.status(500).json({ error: "No se pudieron obtener las preguntas del examen" });
  }
};

export const adminSetExamQuestions = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const examId = Number(req.params.id);
    if (!examId) {
      conn.release();
      return res.status(400).json({ error: "id invalido" });
    }

    const { questions = [] } = req.body || {};
    if (!Array.isArray(questions)) {
      conn.release();
      return res.status(400).json({ error: "questions debe ser arreglo" });
    }
    const cleaned = questions
      .map((q) => ({
        question_id: Number(q.question_id),
        order_idx: Number(q.order_idx ?? 0),
      }))
      .filter((q) => Number.isInteger(q.question_id));
    if (cleaned.length === 0) {
      conn.release();
      return res.status(400).json({ error: "Debes enviar preguntas para el examen" });
    }

    const ids = cleaned.map((q) => q.question_id);
    const placeholders = ids.map(() => "?").join(",");
    const [validQs] = await conn.query(
      `SELECT id FROM questions WHERE id IN (${placeholders})`,
      ids
    );
    if (validQs.length !== ids.length) {
      conn.release();
      return res.status(400).json({ error: "Hay preguntas invalidas en la asignacion" });
    }

    await conn.beginTransaction();
    await conn.query(`DELETE FROM exam_questions WHERE exam_id = ?`, [examId]);

    const values = cleaned.map(() => "(?,?,?)").join(",");
    const flat = [];
    for (const q of cleaned) {
      flat.push(examId, q.question_id, Number.isInteger(q.order_idx) ? q.order_idx : 0);
    }
    await conn.query(
      `INSERT INTO exam_questions (exam_id, question_id, order_idx) VALUES ${values}`,
      flat
    );

    await conn.commit();
    return res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    console.error("adminSetExamQuestions error:", err);
    return res.status(500).json({ error: "No se pudieron asignar preguntas al examen" });
  } finally {
    conn.release();
  }
};
/* =====================================================
 * Intentos
 * ===================================================== */
export const adminListAttempts = async (req, res) => {
  try {
    const { limit, offset, page } = parsePagination(req, 20, 200);
    const userId = req.query.user_id ? Number(req.query.user_id) : null;
    const mode = req.query.mode ? String(req.query.mode) : null;
    const examId = req.query.exam_id ? Number(req.query.exam_id) : null;

    const params = [];
    const conds = ["1=1"];
    if (userId) { conds.push("a.user_id = ?"); params.push(userId); }
    if (mode === "practice" || mode === "exam") { conds.push("a.mode = ?"); params.push(mode); }
    if (examId) { conds.push("a.exam_id = ?"); params.push(examId); }

    const where = conds.join(" AND ");

    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) AS total FROM attempts a WHERE ${where}`,
      params
    );
    const total = Number(countRow?.total ?? 0);

    const [rows] = await pool.query(
      `SELECT 
         a.id,
         a.user_id,
         u.name AS user_name,
         u.email AS user_email,
         a.mode,
         a.exam_id,
         e.name AS exam_name,
         a.topic_id,
         t.name AS topic_name,
         a.score,
         a.started_at,
         a.submitted_at,
         a.duration_seconds,
         a.time_limit_seconds
       FROM attempts a
       LEFT JOIN users u ON u.id = a.user_id
       LEFT JOIN exams e ON e.id = a.exam_id
       LEFT JOIN topics t ON t.id = a.topic_id
       WHERE ${where}
       ORDER BY a.started_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.json({
      ok: true,
      attempts: rows,
      total,
      page,
      page_size: limit,
      has_more: offset + limit < total,
    });
  } catch (err) {
    console.error("adminListAttempts error:", err);
    return res.status(500).json({ error: "No se pudieron listar los intentos" });
  }
};

export const adminGetAttemptDetail = async (req, res) => {
  try {
    const attemptId = Number(req.params.id);
    if (!attemptId) return res.status(400).json({ error: "id invalido" });

    const [attRows] = await pool.query(
      `SELECT 
         a.id,
         a.user_id,
         u.name AS user_name,
         u.email AS user_email,
         a.mode,
         a.exam_id,
         e.name AS exam_name,
         a.topic_id,
         t.name AS topic_name,
         a.score,
         a.started_at,
         a.submitted_at,
         a.duration_seconds,
         a.time_limit_seconds
       FROM attempts a
       LEFT JOIN users u ON u.id = a.user_id
       LEFT JOIN exams e ON e.id = a.exam_id
       LEFT JOIN topics t ON t.id = a.topic_id
       WHERE a.id = ?`,
      [attemptId]
    );
    const att = attRows[0];
    if (!att) return res.status(404).json({ error: "Intento no encontrado" });

    const [ansRows] = await pool.query(
      `SELECT
         aa.id,
         aa.question_id,
         aa.option_id,
         aa.is_correct,
         q.stem,
         o.label AS selected_label,
         o.text AS selected_text
       FROM attempt_answers aa
       JOIN questions q ON q.id = aa.question_id
       LEFT JOIN options o ON o.id = aa.option_id
       WHERE aa.attempt_id = ?
       ORDER BY aa.id ASC`,
      [attemptId]
    );

    const optionsByQ = new Map();
    const qIds = ansRows.map((a) => a.question_id);
    if (qIds.length > 0) {
      const placeholders = qIds.map(() => "?").join(",");
      const [optRows] = await pool.query(
        `SELECT id, question_id, label, text, is_correct
           FROM options
          WHERE question_id IN (${placeholders})
          ORDER BY question_id ASC, label ASC`,
        qIds
      );
      for (const o of optRows) {
        if (!optionsByQ.has(o.question_id)) optionsByQ.set(o.question_id, []);
        optionsByQ.get(o.question_id).push({
          id: o.id,
          label: o.label,
          text: o.text,
          is_correct: !!o.is_correct,
        });
      }
    }

    const answers = ansRows.map((a) => ({
      id: a.id,
      question_id: a.question_id,
      option_id: a.option_id,
      selected_label: a.selected_label,
      selected_option: a.option_id
        ? { id: a.option_id, label: a.selected_label, text: a.selected_text }
        : null,
      is_correct: a.is_correct == null ? null : !!a.is_correct,
      stem: a.stem,
      options: optionsByQ.get(a.question_id) || [],
    }));

    const attempt = {
      id: att.id,
      mode: att.mode,
      score: att.score,
      started_at: att.started_at,
      submitted_at: att.submitted_at,
      duration_seconds: att.duration_seconds,
      time_limit_seconds: att.time_limit_seconds,
      user: {
        id: att.user_id,
        name: att.user_name,
        email: att.user_email,
      },
      exam: att.exam_id ? { id: att.exam_id, name: att.exam_name } : null,
      topic: att.topic_id ? { id: att.topic_id, name: att.topic_name } : null,
    };

    return res.json({ ok: true, attempt, answers });
  } catch (err) {
    console.error("adminGetAttemptDetail error:", err);
    return res.status(500).json({ error: "No se pudo obtener el detalle" });
  }
};
/* =====================================================
 * Eventos analiticos
 * ===================================================== */
export const adminListEvents = async (req, res) => {
  try {
    const { limit, offset, page } = parsePagination(req, 30, 200);
    const userId = req.query.user_id ? Number(req.query.user_id) : null;
    const eventType = String(req.query.event_type ?? "").trim();
    const from = req.query.from ? new Date(String(req.query.from)) : null;
    const to = req.query.to ? new Date(String(req.query.to)) : null;

    const params = [];
    const conds = ["1=1"];
    if (userId) { conds.push("ae.user_id = ?"); params.push(userId); }
    if (eventType) { conds.push("ae.event_type = ?"); params.push(eventType); }
    if (from instanceof Date && !isNaN(from)) { conds.push("ae.created_at >= ?"); params.push(from); }
    if (to instanceof Date && !isNaN(to)) { conds.push("ae.created_at <= ?"); params.push(to); }

    const where = conds.join(" AND ");

    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) AS total FROM analytics_events ae WHERE ${where}`,
      params
    );
    const total = Number(countRow?.total ?? 0);

    const [rows] = await pool.query(
      `SELECT 
         ae.id,
         ae.user_id,
         u.email AS user_email,
         ae.event_type,
         ae.payload,
         ae.created_at
       FROM analytics_events ae
       LEFT JOIN users u ON u.id = ae.user_id
       WHERE ${where}
       ORDER BY ae.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const events = rows.map((r) => {
      let payload = null;
      if (r.payload != null) {
        try { payload = typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload; }
        catch { payload = r.payload; }
      }
      return { ...r, payload };
    });

    return res.json({
      ok: true,
      events,
      total,
      page,
      page_size: limit,
      has_more: offset + limit < total,
    });
  } catch (err) {
    console.error("adminListEvents error:", err);
    return res.status(500).json({ error: "No se pudieron listar los eventos" });
  }
};
