import { pool } from "../config/db.js";

export const getAllTopicsSimple = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.id, t.name, t.unit_id, u.name AS unit_name
         FROM topics t
         LEFT JOIN units u ON u.id = t.unit_id
        ORDER BY u.name ASC, t.name ASC`
    );
    res.json({ ok: true, topics: rows });
  } catch (err) {
    console.error("GET /topics/all error:", err);
    res.status(500).json({ error: "No se pudieron obtener los temas" });
  }
};
