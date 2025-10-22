import { pool } from "../config/db.js";

// Controlador para obtener todas las unidades con sus temas
export const getUnits = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id AS unit_id,
        u.name AS unit_name,
        t.id AS topic_id,
        t.name AS topic_name
      FROM units u
      LEFT JOIN topics t ON t.unit_id = u.id
      ORDER BY u.order_idx, t.order_idx;
    `);

    // Agrupar las filas por unidad
    const units = [];
    rows.forEach((r) => {
      let unit = units.find((u) => u.id === r.unit_id);
      if (!unit) {
        unit = { id: r.unit_id, name: r.unit_name, topics: [] };
        units.push(unit);
      }
      if (r.topic_id) {
        unit.topics.push({ id: r.topic_id, name: r.topic_name });
      }
    });

    res.json(units);
  } catch (err) {
    console.error("❌ Error en GET /units:", err);
    res.status(500).json({ error: "Error al obtener unidades" });
  }
};
